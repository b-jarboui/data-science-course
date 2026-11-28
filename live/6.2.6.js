// lesson 6.2.6
// The nonparametric bootstrap — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed shared chapter data and seed-62 resample.
// Histogram counts reconstructed using NumPy default_rng(62),
// with 10,000 resamples of 16 deliveries, and embedded for browser playback.
// No external libraries or random generation are required at runtime.
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Fixed shared chapter data.
  const D1 = [
    23, 25, 26, 26, 27, 28, 29, 30,
    30, 31, 32, 33, 34, 34, 35, 37
  ];

  // Fixed seed-62 resample, in its original draw order.
  const DRAW = [
    30, 31, 31, 33, 34, 34, 26, 27,
    25, 33, 30, 35, 26, 30, 35, 34
  ];

  // Original card indices, preserving the identity of duplicate cards.
  const DRAW_IDS = [
    7, 9, 9, 11, 12, 12, 3, 4,
    1, 11, 8, 14, 3, 8, 14, 13
  ];

  // Fixed sorted resample from the shared chapter data.
  const RESAMPLE = [
    25, 26, 26, 27, 30, 30, 30, 31,
    31, 33, 33, 34, 34, 34, 35, 35
  ];

  const MISSING = [23, 28, 29, 32, 37];

  const N = 16;
  const ORIGINAL_SUM = 480;
  const ORIGINAL_MEAN = 30;
  const ORIGINAL_MEDIAN = 30;
  const ORIGINAL_SD = 4;
  const FORMULA_SE = 1;

  const RESAMPLE_SUM = 494;
  const RESAMPLE_MEAN = 30.875;
  const RESAMPLE_MEDIAN = 31;

  const B = 10000;
  const BOOTSTRAP_SE = 0.98;

  const MISSING_PROBABILITY = Math.pow(15 / 16, 16);

  // Actual histogram counts reconstructed with seed 62.
  // Bin width = 0.5 minutes.
  // First bin: [25.75, 26.25).
  // Last bin:  [34.25, 34.75].
  // Counts sum to exactly 10,000.
  // Reconstructed mean = 29.99824375.
  // Reconstructed sample SD = 0.9779538469854399.
  const HIST_COUNTS = [
    0, 2, 13, 86, 248, 580,
    1182, 1840, 1937, 1836, 1205, 680,
    263, 97, 28, 3, 0, 0
  ];

  const HIST_CENTERS = HIST_COUNTS.map((_, i) => 26 + i * 0.5);

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

  const AY = P ? -2.95 : -1.90;

  const HISTBASE = P ? -3.45 : -2.15;
  const HISTHEIGHT = P ? 3.95 : 2.40;

  const realX = v => LEFT + (v - 22) / 16 * W;
  const histX = v => LEFT + (v - 25.75) / 9 * W;
  const meanX = v => LEFT + (v - 26) / 8 * W;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fade = xs => xs.map(x => new M.FadeOut(x));

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

  // Horizontal measurement bracket.
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

  // Horizontal interval ("net") with endpoint caps.
  function net(xmap, m, r, y, color = C.cyan, cap = 0.13) {
    return new M.VGroup(
      ln(
        xmap(m - r), y,
        xmap(m + r), y,
        color, 5
      ),

      ln(
        xmap(m - r), y - cap,
        xmap(m - r), y + cap,
        color, 2
      ),

      ln(
        xmap(m + r), y - cap,
        xmap(m + r), y + cap,
        color, 2
      )
    );
  }

  // Small directional arrow, constructed from ordinary lines.
  function arrow(x1, y1, x2, y2, color = C.cyan, width = 2.5) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.17;
    const a = Math.PI / 6;

    return new M.VGroup(
      ln(x1, y1, x2, y2, color, width),

      ln(
        x2,
        y2,
        x2 - h * Math.cos(angle - a),
        y2 - h * Math.sin(angle - a),
        color,
        width
      ),

      ln(
        x2,
        y2,
        x2 - h * Math.cos(angle + a),
        y2 - h * Math.sin(angle + a),
        color,
        width
      )
    );
  }

  // One active main picture.
  // Incoming groups contain fresh objects only.
  let pictureNow = null;

  function picture(next) {
    const a = [];

    if (pictureNow) a.push(new M.FadeOut(pictureNow));

    if (next) a.push(new M.FadeIn(next));

    pictureNow = next;

    return a;
  }

  // ---------------------------------------------------------------
  // Reusable visual components.
  // ---------------------------------------------------------------

  // One delivery-time card.
  function card(
    value,
    x,
    y,
    color = C.cyan,
    w = 0.65,
    h = 0.48,
    fontSize = P ? 21 : 19,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.07,
      color,
      strokeWidth: 1.5
    });

    r.setFill(C.card, opacity);
    r.moveTo([x, y, 0]);

    const valueText = txt(
      String(value),
      fontSize,
      color,
      [x, y, 0],
      true,
      w - 0.08
    );

    return new M.VGroup(r, valueText);
  }

  // Placeholder for a card not yet drawn.
  function emptyCard(x, y, w, h) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.07,
      color: C.muted,
      strokeWidth: 1
    });

    r.setFill(C.card, 0.20);
    r.moveTo([x, y, 0]);

    return r;
  }

  // Sami's actual deliveries on a number line.
  // Duplicate observations stack vertically.
  function samplePicture({
    showMean = false,
    showMedian = false,
    showNet = false,
    showMaximum = false,
    showBeyond = false,
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
        P ? 23 : 21,
        C.ink,
        [CX, P ? 1.15 : 1.15, 0]
      )
    ];

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i)
        .filter(x => x === v).length;

      const color = showMaximum && v === 37
        ? GOLD
        : C.cyan;

      parts.push(glowDot(
        realX(v),
        AY + 0.25 + repeat * 0.31,
        color,
        P ? 0.085 : 0.095
      ));
    });

    if (showMean || showMedian) {
      const y = P ? -0.65 : -0.42;
      const color = showMedian ? C.green : C.violet;

      parts.push(
        glowDot(
          realX(30),
          y,
          color,
          0.12
        ),

        txt(
          showMedian ? 'median = 30' : 'mean = 30',
          P ? 21 : 19,
          color,
          [realX(30), y + 0.44, 0],
          true
        )
      );

      if (showNet) {
        parts.push(
          net(
            realX,
            ORIGINAL_MEAN,
            1.96,
            y,
            C.violet,
            0.15
          ),

          txt(
            'A net needs a width',
            P ? 19 : 17,
            C.violet,
            [CX, y - 0.46, 0]
          )
        );
      }
    }

    if (showMaximum) {
      const x = realX(37);

      parts.push(
        ln(
          x,
          AY,
          x,
          P ? 0.10 : 0.12,
          GOLD,
          3
        ),

        txt(
          '37 min',
          P ? 20 : 18,
          GOLD,
          [x - 0.24, P ? 0.43 : 0.45, 0],
          true
        ),

        txt(
          'Largest observed value',
          P ? 18 : 16,
          GOLD,
          [CX, AY + 1.06, 0]
        )
      );
    }

    if (showBeyond) {
      const x = realX(37);

      const top = P ? 0.10 : 0.12;

      parts.push(
        rect(
          RIGHT - x,
          top - AY,
          (RIGHT + x) / 2,
          (top + AY) / 2,
          MISS,
          0.10,
          0
        ),

        txt(
          '×',
          P ? 31 : 27,
          MISS,
          [(RIGHT + x) / 2, AY + 0.70, 0],
          true
        ),

        txt(
          'Nothing beyond 37 in a resample',
          P ? 20 : 18,
          MISS,
          [CX, P ? -4.40 : -2.75, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Original sixteen delivery-time cards.
  function originalCardsPicture({
    highlightMedian = false,
    highlightMaximum = false,
    title = 'Our original sample'
  } = {}) {
    const dx = P ? 0.73 : 0.72;
    const dy = P ? 0.75 : 0.62;

    const top = P ? 0.20 : 0.18;

    const parts = [];

    D1.forEach((v, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);

      const x = CX + (col - 3.5) * dx;
      const y = top - row * dy;

      let color = C.cyan;

      if (highlightMedian && (i === 7 || i === 8)) {
        color = C.green;
      }

      if (highlightMaximum && v === 37) {
        color = GOLD;
      }

      parts.push(card(
        v,
        x,
        y,
        color,
        dx * 0.87,
        dy * 0.77
      ));
    });

    parts.push(txt(
      title,
      P ? 23 : 21,
      C.ink,
      [CX, top + 0.82, 0]
    ));

    if (highlightMedian) {
      parts.push(
        txt(
          'Two middle values: 30 and 30',
          P ? 20 : 18,
          C.green,
          [CX, top - dy - 0.75, 0]
        ),

        txt(
          'Median = 30',
          P ? 26 : 24,
          C.green,
          [CX, top - dy - 1.25, 0],
          true
        )
      );
    } else {
      parts.push(
        txt(
          '16 delivery times, in minutes',
          P ? 20 : 18,
          C.muted,
          [CX, top - dy - 0.75, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Schematic picture of many samples that could have been
  // collected from the actual route.
  // These are illustrative samples, not additional real observations.
  function manyRealSamples() {
    const top = P ? 0.68 : 0.74;
    const pitch = P ? 0.94 : 0.65;

    const parts = [];

    const offsets = [
      -1.1, 0.4, 1.3, -0.5, 0.8
    ];

    offsets.forEach((offset, i) => {
      const y = top - i * pitch;

      const labelX = CX - W * 0.34;

      parts.push(txt(
        `Sample ${i + 1}`,
        P ? 17 : 15,
        C.muted,
        [labelX, y, 0],
        false,
        W * 0.25
      ));

      for (let j = 0; j < 16; j++) {
        const col = j % 8;
        const row = Math.floor(j / 8);

        parts.push(glowDot(
          CX - 0.66 + col * 0.19,
          y + 0.10 - row * 0.20,
          C.cyan,
          P ? 0.045 : 0.038
        ));
      }

      parts.push(
        arrow(
          CX + 0.92,
          y,
          CX + 1.34,
          y,
          C.muted,
          1.8
        ),

        glowDot(
          CX + 2.10 + offset * 0.24,
          y,
          C.violet,
          P ? 0.085 : 0.065
        )
      );
    });

    parts.push(
      txt(
        'New samples, different estimates',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.54, 0]
      ),

      txt(
        'Illustrative possible samples',
        P ? 17 : 15,
        C.muted,
        [CX, top - 4 * pitch - 0.58, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // The practical problem: Sami cannot collect thousands
  // of additional real samples just for this calculation.
  function expensiveSamplingPicture() {
    const y = P ? -0.85 : -0.65;

    const road = ln(
      CX - 2.70,
      y - 0.72,
      CX + 2.70,
      y - 0.72,
      C.muted,
      5
    );

    const stops = [-2.4, -0.8, 0.8, 2.4].map(dx =>
      glowDot(
        CX + dx,
        y - 0.72,
        C.muted,
        0.09
      )
    );

    const parcel = new M.RoundedRectangle({
      width: 1.10,
      height: 0.90,
      cornerRadius: 0.09,
      color: GOLD,
      strokeWidth: 2
    });

    parcel.setFill(GOLD, 0.22);
    parcel.moveTo([CX, y + 0.05, 0]);

    const tape = ln(
      CX,
      y - 0.40,
      CX,
      y + 0.50,
      GOLD,
      4
    );

    return new M.VGroup(
      road,
      ...stops,
      parcel,
      tape,

      txt(
        '10,000 more trips?',
        P ? 29 : 26,
        GOLD,
        [CX, y + 1.62, 0],
        true
      ),

      txt(
        'Too much time and effort',
        P ? 21 : 19,
        C.ink,
        [CX, y - 1.36, 0]
      ),

      txt(
        '×',
        P ? 39 : 35,
        MISS,
        [CX + 1.35, y + 0.08, 0],
        true
      )
    );
  }

  // ---------------------------------------------------------------
  // Hat and card-drawing layout.
  //
  // Phone: a little more vertical spacing.
  // Laptop: compact side-by-side picture.
  //
  // Left: the original sixteen cards, which remain available.
  // Right: the sixteen recorded draws.
  // ---------------------------------------------------------------

  const HATX = CX - 1.67;
  const TRAYX = CX + 1.67;

  const CARD_DX = P ? 0.58 : 0.58;
  const CARD_DY = P ? 0.57 : 0.46;

  const CARD_W = CARD_DX * 0.84;
  const CARD_H = CARD_DY * 0.80;

  const CARD_TOP = P ? 0.04 : 0.12;

  const cardSlot = (center, i) => [
    center + (i % 4 - 1.5) * CARD_DX,
    CARD_TOP - Math.floor(i / 4) * CARD_DY,
    0
  ];

  const hatSlot = i => cardSlot(HATX, i);
  const traySlot = i => cardSlot(TRAYX, i);

  function sourceCard(i, color = C.cyan) {
    const p = hatSlot(i);

    return card(
      D1[i],
      p[0],
      p[1],
      color,
      CARD_W,
      CARD_H,
      P ? 18 : 17
    );
  }

  function drawnCard(i, color = C.violet) {
    const p = traySlot(i);

    return card(
      DRAW[i],
      p[0],
      p[1],
      color,
      CARD_W,
      CARD_H,
      P ? 18 : 17
    );
  }

  // A simple open container, drawn from coordinates.
  // The transparent front allows the sixteen cards to remain visible.
  function hatOutline() {
    const top = CARD_TOP + 0.37;
    const bottom = CARD_TOP - 3 * CARD_DY - 0.44;

    const half = 1.30;

    return new M.VGroup(
      ln(
        HATX - half - 0.12,
        top,
        HATX + half + 0.12,
        top,
        GOLD,
        4
      ),

      ln(
        HATX - half,
        top,
        HATX - half + 0.10,
        bottom,
        GOLD,
        2.5
      ),

      ln(
        HATX + half,
        top,
        HATX + half - 0.10,
        bottom,
        GOLD,
        2.5
      ),

      ln(
        HATX - half + 0.10,
        bottom,
        HATX + half - 0.10,
        bottom,
        GOLD,
        2.5
      )
    );
  }

  function trayOutline() {
    const top = CARD_TOP + 0.37;
    const bottom = CARD_TOP - 3 * CARD_DY - 0.44;

    return outline(
      TRAYX,
      (top + bottom) / 2,
      2.55,
      top - bottom,
      C.violet
    );
  }

  function hatPicture({
    drawn = 0,
    missingSource = -1,
    highlightSource = -1,
    showReplacement = false,
    showDuplicates = false,
    showMissing = false,
    caption = ''
  } = {}) {
    const parts = [
      hatOutline(),
      trayOutline(),

      txt(
        'ORIGINAL CARDS',
        P ? 18 : 16,
        C.cyan,
        [HATX, CARD_TOP + 0.98, 0],
        true,
        2.80
      ),

      txt(
        'RESAMPLE',
        P ? 18 : 16,
        C.violet,
        [TRAYX, CARD_TOP + 0.98, 0],
        true,
        2.80
      )
    ];

    for (let i = 0; i < N; i++) {
      const hp = hatSlot(i);
      const tp = traySlot(i);

      if (i === missingSource) {
        parts.push(emptyCard(
          hp[0],
          hp[1],
          CARD_W,
          CARD_H
        ));
      } else {
        let color = C.cyan;

        if (i === highlightSource) {
          color = GOLD;
        }

        if (showMissing && MISSING.includes(D1[i])) {
          color = MISS;
        }

        parts.push(sourceCard(i, color));
      }

      if (i < drawn) {
        let color = C.violet;

        if (
          showDuplicates &&
          (DRAW[i] === 30 || DRAW[i] === 34)
        ) {
          color = GOLD;
        }

        parts.push(drawnCard(i, color));
      } else {
        parts.push(emptyCard(
          tp[0],
          tp[1],
          CARD_W,
          CARD_H
        ));
      }
    }

    const bottom = CARD_TOP - 3 * CARD_DY;

    parts.push(
      txt(
        `${missingSource >= 0 ? 15 : 16} available`,
        P ? 18 : 16,
        C.cyan,
        [HATX, bottom - 0.76, 0],
        true
      ),

      txt(
        `${drawn} recorded`,
        P ? 18 : 16,
        C.violet,
        [TRAYX, bottom - 0.76, 0],
        true
      )
    );

    if (showReplacement) {
      parts.push(
        arrow(
          HATX + 0.78,
          CARD_TOP + 0.53,
          TRAYX - 0.78,
          CARD_TOP + 0.53,
          C.violet,
          2.4
        ),

        arrow(
          TRAYX - 0.78,
          bottom - 0.61,
          HATX + 0.78,
          bottom - 0.61,
          C.green,
          2.4
        )
      );
    }

    if (caption) {
      parts.push(txt(
        caption,
        P ? 19 : 17,
        showReplacement ? C.green : C.ink,
        [CX, bottom - 1.20, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Original sample and resample comparison.
  //
  // Each row consists of sixteen cards, split into two lines of eight.
  // This keeps all sixteen values readable on phone and laptop.
  // ---------------------------------------------------------------

  function comparisonCards({
    highlightRepeated = false,
    highlightMissing = false,
    showMeans = false,
    showMedian = false,
    showMaximum = false,
    labelResample = 'Sorted resample'
  } = {}) {
    const dx = P ? 0.72 : 0.72;

    const cardW = dx * 0.87;
    const cardH = P ? 0.46 : 0.39;

    const upper = P ? 0.57 : 0.69;
    const lower = P ? -1.72 : -0.91;

    const dy = P ? 0.55 : 0.45;

    const parts = [];

    function rowCards(values, top, isResample) {
      values.forEach((v, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);

        const x = CX + (col - 3.5) * dx;
        const y = top - row * dy;

        let color = isResample ? C.violet : C.cyan;

        if (
          highlightRepeated &&
          isResample &&
          (v === 30 || v === 34)
        ) {
          color = GOLD;
        }

        if (
          highlightMissing &&
          !isResample &&
          MISSING.includes(v)
        ) {
          color = MISS;
        }

        if (
          showMedian &&
          (i === 7 || i === 8)
        ) {
          color = C.green;
        }

        if (showMaximum && !isResample && v === 37) {
          color = GOLD;
        }

        parts.push(card(
          v,
          x,
          y,
          color,
          cardW,
          cardH,
          P ? 19 : 17
        ));
      });
    }

    rowCards(D1, upper, false);
    rowCards(RESAMPLE, lower, true);

    parts.push(
      txt(
        'Original sample: 16 values',
        P ? 21 : 19,
        C.cyan,
        [CX, upper + 0.56, 0]
      ),

      txt(
        `${labelResample}: 16 values`,
        P ? 21 : 19,
        C.violet,
        [CX, lower + 0.57, 0]
      )
    );

    if (showMeans) {
      parts.push(
        txt(
          'Original mean = 30',
          P ? 20 : 18,
          C.cyan,
          [CX, upper - dy - 0.39, 0],
          true
        ),

        txt(
          'Resample mean = 30.875',
          P ? 21 : 19,
          C.violet,
          [CX, lower - dy - 0.51, 0],
          true
        )
      );
    }

    if (highlightRepeated) {
      parts.push(txt(
        '30 appears 3 times · 34 appears 3 times',
        P ? 19 : 17,
        GOLD,
        [CX, lower - dy - 0.58, 0]
      ));
    }

    if (highlightMissing) {
      parts.push(txt(
        'Missing: 23, 28, 29, 32, 37',
        P ? 20 : 18,
        MISS,
        [CX, lower - dy - 0.58, 0],
        true
      ));
    }

    if (showMedian) {
      parts.push(
        txt(
          'Original median = 30',
          P ? 19 : 17,
          C.green,
          [CX, upper - dy - 0.37, 0],
          true
        ),

        txt(
          'Resample median = 31',
          P ? 19 : 17,
          C.green,
          [CX, lower - dy - 0.49, 0],
          true
        )
      );
    }

    if (showMaximum) {
      parts.push(txt(
        'Resamples use only observed values',
        P ? 19 : 17,
        GOLD,
        [CX, lower - dy - 0.58, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Original data and resampled data as glowing dots on
  // the same minutes scale.
  function sampleMeansComparison() {
    const upperY = P ? 0.40 : 0.43;
    const lowerY = P ? -1.70 : -1.15;

    const base = P ? -3.70 : -2.25;

    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        base
      )
    ];

    function dots(values, y, color) {
      values.forEach((v, i) => {
        const repeat = values.slice(0, i)
          .filter(x => x === v).length;

        parts.push(glowDot(
          realX(v),
          y + repeat * (P ? 0.25 : 0.17),
          color,
          P ? 0.067 : 0.055
        ));
      });
    }

    dots(D1, upperY, C.cyan);
    dots(RESAMPLE, lowerY, C.violet);

    parts.push(
      txt(
        'Original sample',
        P ? 21 : 19,
        C.cyan,
        [CX, upperY + 0.73, 0]
      ),

      txt(
        'Bootstrap resample',
        P ? 21 : 19,
        C.violet,
        [CX, lowerY + 0.82, 0]
      ),

      ln(
        realX(ORIGINAL_MEAN),
        upperY - 0.23,
        realX(ORIGINAL_MEAN),
        upperY + 0.47,
        C.cyan,
        3
      ),

      ln(
        realX(RESAMPLE_MEAN),
        lowerY - 0.23,
        realX(RESAMPLE_MEAN),
        lowerY + 0.60,
        C.violet,
        3
      ),

      txt(
        'mean = 30',
        P ? 19 : 17,
        C.cyan,
        [realX(ORIGINAL_MEAN), upperY - 0.45, 0],
        true
      ),

      txt(
        'mean ≈ 30.9',
        P ? 19 : 17,
        C.violet,
        [realX(RESAMPLE_MEAN), lowerY - 0.45, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // Probability of leaving out one particular original card.
  // The highlighted card is the unique observation 23 minutes.
  function missingCardProbabilityPicture() {
    const parts = [];

    const top = P ? 0.73 : 0.73;

    const dx = P ? 0.65 : 0.64;
    const dy = P ? 0.50 : 0.43;

    for (let i = 0; i < N; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(card(
        D1[i],
        CX + (col - 3.5) * dx,
        top - row * dy,
        i === 0 ? GOLD : C.cyan,
        dx * 0.84,
        dy * 0.79,
        P ? 18 : 16
      ));
    }

    parts.push(txt(
      'Pick one particular card',
      P ? 21 : 19,
      C.ink,
      [CX, top + 0.57, 0]
    ));

    const cols = 10;
    const rows = 10;

    const gx = P ? 0.36 : 0.28;
    const gy = P ? 0.30 : 0.18;

    const gridTop = P ? -0.78 : -0.40;

    // A representative pictogram: 36 of 100 resamples omit this card.
    // This visual count is rounded from the exact probability.
    for (let i = 0; i < 100; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const omitted = ((i * 37 + 11) % 100) < 36;

      parts.push(glowDot(
        CX + (col - 4.5) * gx,
        gridTop - row * gy,
        omitted ? GOLD : C.muted,
        P ? 0.057 : 0.043
      ));
    }

    const bottom = gridTop - (rows - 1) * gy;

    parts.push(
      txt(
        'About 36 in 100 leave it out',
        P ? 21 : 19,
        GOLD,
        [CX, bottom - 0.40, 0]
      ),

      txt(
        '≈ one chance in three',
        P ? 19 : 17,
        C.ink,
        [CX, bottom - 0.79, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Many bootstrap resamples.
  //
  // The first displayed resample is the fixed seed-62 example.
  // Other rows are schematic examples explaining the process.
  // They are labelled as illustrative, not additional checked data.
  // ---------------------------------------------------------------

  function repeatResamplesPicture({
    title = 'Repeat the same resampling process',
    estimate = 'mean'
  } = {}) {
    const top = P ? 0.64 : 0.69;
    const pitch = P ? 0.92 : 0.66;

    const parts = [];

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

    examples.forEach((values, i) => {
      const y = top - i * pitch;

      parts.push(txt(
        String(i + 1),
        P ? 16 : 14,
        C.muted,
        [LEFT + 0.20, y, 0],
        true
      ));

      for (let j = 0; j < 16; j++) {
        const col = j % 8;
        const row = Math.floor(j / 8);

        const x = CX - 1.85 + col * 0.36;
        const yy = y + 0.14 - row * 0.28;

        parts.push(card(
          values[j],
          x,
          yy,
          C.violet,
          0.31,
          0.25,
          P ? 12 : 11
        ));
      }

      parts.push(arrow(
        CX + 0.91,
        y,
        CX + 1.38,
        y,
        C.muted,
        2
      ));

      const sorted = values.slice().sort((a, b) => a - b);

      const value = estimate === 'median'
        ? (sorted[7] + sorted[8]) / 2
        : values.reduce((a, b) => a + b, 0) / N;

      parts.push(
        glowDot(
          CX + 1.66,
          y,
          C.violet,
          P ? 0.07 : 0.055
        ),

        txt(
          value.toFixed(1),
          P ? 21 : 19,
          C.violet,
          [CX + 2.30, y, 0],
          true
        )
      );
    });

    parts.push(
      txt(
        title,
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.57, 0]
      ),

      txt(
        '⋮',
        P ? 27 : 24,
        C.muted,
        [CX, top - 3 * pitch - 0.44, 0]
      ),

      txt(
        '10,000 resamples',
        P ? 24 : 22,
        C.violet,
        [CX, top - 3 * pitch - 0.96, 0],
        true
      )
    );

    if (P) {
      parts.push(txt(
        'Rows illustrate repeated draws',
        P ? 17 : 16,
        C.muted,
        [CX, top - 3 * pitch - 1.39, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // Histogram of the 10,000 bootstrap means.
  //
  // Uses actual reconstructed bin counts, not a normal-curve proxy.
  // All bars use the same linear frequency scale.
  // ---------------------------------------------------------------

  function histogramParts({
    highlightCenter = false,
    showSpread = false,
    showValue = false,
    showCount = true,
    title = '10,000 bootstrap means'
  } = {}) {
    const parts = [];
    const bars = [];

    const MAX_COUNT = Math.max(...HIST_COUNTS);

    const top = HISTBASE + HISTHEIGHT;

    // Horizontal reference grid lines.
    [500, 1000, 1500, 2000].forEach(count => {
      const y =
        HISTBASE +
        count / MAX_COUNT * HISTHEIGHT;

      parts.push(
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
          0.58
        )
      );
    });

    // Main x-axis.
    parts.push(
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
        top + 0.13,
        C.muted,
        2
      )
    );

    [26, 28, 30, 32, 34].forEach(v => {
      parts.push(
        ln(
          histX(v),
          HISTBASE - 0.07,
          histX(v),
          HISTBASE + 0.07,
          C.muted,
          1.8
        ),

        txt(
          String(v),
          P ? 17 : 15,
          C.muted,
          [histX(v), HISTBASE - 0.26, 0],
          true
        )
      );
    });

    parts.push(
      txt(
        'resample mean (minutes)',
        P ? 18 : 16,
        C.muted,
        [CX, HISTBASE - 0.59, 0]
      ),

      txt(
        'count',
        P ? 15 : 13,
        C.muted,
        [LEFT + 0.27, top + 0.31, 0]
      ),

      txt(
        title,
        P ? 22 : 20,
        C.ink,
        [CX, top + 0.67, 0]
      )
    );

    // Real histogram frequencies.
    HIST_COUNTS.forEach((count, i) => {
      if (count === 0) return;

      const center = HIST_CENTERS[i];

      const h =
        count / MAX_COUNT * HISTHEIGHT;

      const w =
        histX(center + 0.25) -
        histX(center - 0.25);

      const insideSpread =
        Math.abs(center - ORIGINAL_MEAN) <= BOOTSTRAP_SE;

      const color = showSpread && insideSpread
        ? C.violet
        : highlightCenter && center === 30
          ? C.green
          : C.cyan;

      bars.push(rect(
        w * 0.91,
        Math.max(0.001, h),
        histX(center),
        HISTBASE + h / 2,
        color,
        showSpread && !insideSpread ? 0.40 : 0.83,
        1
      ));
    });

    const extras = [];

    if (highlightCenter || showSpread) {
      // This line marks the original sample mean, not the unknown
      // true route mean, so it is violet rather than gold.
      extras.push(
        ln(
          histX(ORIGINAL_MEAN),
          HISTBASE,
          histX(ORIGINAL_MEAN),
          top + 0.14,
          C.violet,
          2.5
        ),

        txt(
          'original mean = 30',
          P ? 17 : 15,
          C.violet,
          [histX(30), HISTBASE - 0.99, 0],
          true
        )
      );
    }

    if (showSpread) {
      const y = HISTBASE + HISTHEIGHT * 0.37;

      extras.push(
        bracket(
          histX(ORIGINAL_MEAN - BOOTSTRAP_SE),
          histX(ORIGINAL_MEAN + BOOTSTRAP_SE),
          y,
          GOLD,
          0.10
        ),

        new M.DashedLine({
          start: [
            histX(ORIGINAL_MEAN - BOOTSTRAP_SE),
            HISTBASE,
            0
          ],

          end: [
            histX(ORIGINAL_MEAN - BOOTSTRAP_SE),
            y + 0.10,
            0
          ],

          color: GOLD
        }),

        new M.DashedLine({
          start: [
            histX(ORIGINAL_MEAN + BOOTSTRAP_SE),
            HISTBASE,
            0
          ],

          end: [
            histX(ORIGINAL_MEAN + BOOTSTRAP_SE),
            y + 0.10,
            0
          ],

          color: GOLD
        })
      );

      // Labels sit in the empty space right of the pile, not on the bars.
      const labY = HISTBASE + HISTHEIGHT * 0.74;
      const atRight = t => {
        t.moveTo([RIGHT - t.getWidth() / 2, t.getCenter()[1], 0]);
        return t;
      };

      if (showValue) {
        extras.push(
          atRight(txt(
            '0.98 min',
            P ? 20 : 18,
            GOLD,
            [0, labY, 0],
            true
          )),

          atRight(txt(
            '1 SD each way',
            P ? 17 : 15,
            GOLD,
            [0, labY - (P ? 0.42 : 0.36), 0]
          ))
        );
      } else {
        extras.push(atRight(txt(
          'How wide is the pile?',
          P ? 20 : 18,
          GOLD,
          [0, labY, 0]
        )));
      }
    }

    if (showCount && !highlightCenter && !showSpread) {
      extras.push(txt(
        'Total: 10,000 estimates',
        P ? 18 : 16,
        C.muted,
        [CX, HISTBASE - 0.98, 0]
      ));
    }

    return {
      base: new M.VGroup(...parts),
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

  // Compare bootstrap and formula standard errors.
  // Both measurements use the same scale.
  function seComparisonPicture(highlight = 'both') {
    const upperY = P ? 0.32 : 0.40;
    const lowerY = P ? -1.67 : -1.10;

    const base = P ? -3.65 : -2.26;

    const bootstrapColor =
      highlight === 'formula' ? C.muted : C.violet;

    const formulaColor =
      highlight === 'bootstrap' ? C.muted : C.cyan;

    return new M.VGroup(
      axis(
        meanX,
        [26, 28, 30, 32, 34],
        base
      ),

      net(
        meanX,
        ORIGINAL_MEAN,
        BOOTSTRAP_SE,
        upperY,
        bootstrapColor,
        0.14
      ),

      glowDot(
        meanX(ORIGINAL_MEAN),
        upperY,
        bootstrapColor,
        0.09
      ),

      txt(
        'Bootstrap standard error',
        P ? 22 : 20,
        bootstrapColor,
        [CX, upperY + 0.58, 0]
      ),

      txt(
        '0.98 minutes',
        P ? 25 : 23,
        bootstrapColor,
        [CX, upperY - 0.45, 0],
        true
      ),

      net(
        meanX,
        ORIGINAL_MEAN,
        FORMULA_SE,
        lowerY,
        formulaColor,
        0.14
      ),

      glowDot(
        meanX(ORIGINAL_MEAN),
        lowerY,
        formulaColor,
        0.09
      ),

      txt(
        'Formula standard error',
        P ? 22 : 20,
        formulaColor,
        [CX, lowerY + 0.58, 0]
      ),

      txt(
        '1.00 minute',
        P ? 25 : 23,
        formulaColor,
        [CX, lowerY - 0.45, 0],
        true
      )
    );
  }

  // ---------------------------------------------------------------
  // The bootstrap workflow.
  //
  // Original sample -> resamples -> estimates -> distribution.
  // A single schematic picture shows the complete process.
  // ---------------------------------------------------------------

  function workflowPicture({
    statistic = 'mean',
    title = 'The bootstrap',
    showSpread = false
  } = {}) {
    const parts = [];

    const top = P ? 0.70 : 0.83;
    const middle = P ? -1.08 : -0.40;
    const bottom = P ? -3.35 : -2.03;

    const sourceDX = P ? 0.34 : 0.30;

    // Original sample.
    for (let i = 0; i < N; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(glowDot(
        CX + (col - 3.5) * sourceDX,
        top - row * 0.24,
        C.cyan,
        P ? 0.064 : 0.052
      ));
    }

    parts.push(
      outline(
        CX,
        top - 0.12,
        8 * sourceDX + 0.16,
        0.67,
        C.cyan
      ),

      txt(
        'Original sample',
        P ? 20 : 18,
        C.cyan,
        [CX, top + 0.54, 0]
      )
    );

    // Several resamples branching out from the original sample.
    const branchDX = P ? 1.65 : 1.68;

    for (let k = 0; k < 3; k++) {
      const x = CX + (k - 1) * branchDX;

      parts.push(arrow(
        CX,
        top - 0.51,
        x,
        middle + 0.34,
        C.muted,
        1.8
      ));

      for (let i = 0; i < N; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);

        parts.push(glowDot(
          x + (col - 1.5) * 0.20,
          middle + (1.5 - row) * 0.17,
          C.violet,
          P ? 0.044 : 0.036
        ));
      }

      parts.push(
        outline(
          x,
          middle,
          1.10,
          0.78,
          C.violet
        ),

        txt(
          statistic,
          P ? 16 : 14,
          C.violet,
          [x, middle - 0.57, 0]
        ),

        arrow(
          x,
          middle - 0.73,
          x,
          bottom + 0.57,
          C.muted,
          1.7
        )
      );
    }

    // Small schematic distribution of estimates.
    const heights = [
      1, 2, 4, 7, 10, 12, 10, 7, 4, 2, 1
    ];

    const dx = W / 14;
    const scale = P ? 0.075 : 0.046;

    heights.forEach((v, i) => {
      const h = v * scale;
      const x = CX + (i - 5) * dx;

      parts.push(rect(
        dx * 0.78,
        h,
        x,
        bottom + h / 2,
        C.violet,
        0.80,
        1
      ));
    });

    parts.push(
      ln(
        CX - 5.8 * dx,
        bottom,
        CX + 5.8 * dx,
        bottom,
        C.muted,
        2
      ),

      txt(
        showSpread
          ? 'Spread of estimates'
          : 'Many resampled estimates',
        P ? 20 : 18,
        showSpread ? GOLD : C.ink,
        [CX, bottom - 0.41, 0]
      )
    );

    if (P) {
      parts.push(txt(
        title,
        20,
        C.green,
        [CX, bottom - 0.91, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Show that resampling does not require fitting a population curve.
  function empiricalPicture() {
    const top = P ? 0.58 : 0.66;
    const lower = P ? -2.08 : -1.33;

    const parts = [];

    D1.forEach((v, i) => {
      const repeat = D1.slice(0, i)
        .filter(x => x === v).length;

      parts.push(glowDot(
        realX(v),
        top + repeat * 0.24,
        C.cyan,
        P ? 0.075 : 0.065
      ));
    });

    parts.push(
      ln(
        LEFT,
        top - 0.23,
        RIGHT,
        top - 0.23,
        C.muted,
        2
      ),

      txt(
        'Use the observed deliveries',
        P ? 22 : 20,
        C.cyan,
        [CX, top + 0.73, 0]
      ),

      arrow(
        CX,
        top - 0.54,
        CX,
        lower + 0.78,
        C.violet,
        2.5
      )
    );

    const dx = P ? 0.66 : 0.64;
    const dy = P ? 0.53 : 0.42;

    RESAMPLE.forEach((v, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(card(
        v,
        CX + (col - 3.5) * dx,
        lower - row * dy,
        C.violet,
        dx * 0.84,
        dy * 0.80,
        P ? 18 : 16
      ));
    });

    parts.push(
      txt(
        'Draw from these values',
        P ? 20 : 18,
        C.violet,
        [CX, lower + 0.48, 0]
      ),

      txt(
        'No assumed delivery-time curve',
        P ? 19 : 17,
        C.green,
        [CX, lower - dy - 0.58, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Three different statistics, all computed from resamples.
  function estimatesPicture() {
    const items = [
      {
        title: 'Mean',
        note: 'Average of the values',
        color: C.cyan
      },

      {
        title: 'Median',
        note: 'Middle of the values',
        color: C.green
      },

      {
        title: 'Ratio',
        note: 'One quantity ÷ another',
        color: C.violet
      }
    ];

    const top = P ? 0.73 : 0.78;
    const pitch = P ? 1.27 : 0.94;

    const parts = [];

    items.forEach(({ title, note, color }, i) => {
      const y = top - i * pitch;

      const r = new M.RoundedRectangle({
        width: W - 0.40,
        height: pitch * 0.79,
        cornerRadius: 0.12,
        color,
        strokeWidth: 1.5
      });

      r.setFill(C.card, 0.93);
      r.moveTo([CX, y, 0]);

      parts.push(
        r,

        txt(
          title,
          P ? 24 : 22,
          color,
          [CX - W * 0.30, y, 0],
          true,
          W * 0.24
        ),

        txt(
          note,
          P ? 18 : 16,
          C.ink,
          [CX + W * 0.11, y, 0],
          false,
          W * 0.55
        )
      );
    });

    parts.push(txt(
      'Resample, calculate, repeat',
      P ? 22 : 20,
      C.violet,
      [CX, top - 2 * pitch - 0.84, 0]
    ));

    return new M.VGroup(...parts);
  }

  // The sample acts as a small empirical picture of a much
  // larger population.
  //
  // Background route observations are schematic and do not claim
  // to reveal the actual unknown population.
  function miniatureRoutePicture() {
    const top = P ? 0.55 : 0.75;
    const lower = P ? -2.08 : -1.37;

    const parts = [];

    // Schematic larger route population.
    const popCols = 14;
    const popRows = 4;

    const dx = P ? 0.37 : 0.34;
    const dy = P ? 0.25 : 0.19;

    for (let i = 0; i < popCols * popRows; i++) {
      const col = i % popCols;
      const row = Math.floor(i / popCols);

      const selected =
        ((i * 19 + 7) % 56) < 16;

      parts.push(glowDot(
        CX + (col - (popCols - 1) / 2) * dx,
        top - row * dy,
        selected ? C.cyan : C.muted,
        P ? 0.052 : 0.044
      ));
    }

    parts.push(
      txt(
        'All deliveries on the route',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.54, 0]
      ),

      txt(
        'Illustrative population',
        P ? 16 : 14,
        C.muted,
        [CX, top - 3 * dy - 0.37, 0]
      ),

      arrow(
        CX,
        top - 3 * dy - 0.63,
        CX,
        lower + 0.64,
        C.cyan,
        2.3
      )
    );

    for (let i = 0; i < N; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);

      parts.push(card(
        D1[i],
        CX + (col - 3.5) * 0.65,
        lower - row * 0.43,
        C.cyan,
        0.56,
        0.36,
        P ? 18 : 16
      ));
    }

    parts.push(
      outline(
        CX,
        lower - 0.215,
        5.35,
        0.97,
        C.cyan
      ),

      txt(
        'Our sample: a small picture',
        P ? 21 : 19,
        C.cyan,
        [CX, lower - 1.03, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Schematic illustration of a flawed sample and resamples
  // that reproduce its missing information.
  //
  // Not a claim that Sami's actual sample was selected unfairly.
  function flawedSamplePicture() {
    const x = realX;

    const top = P ? 0.67 : 0.70;
    const middle = P ? -1.05 : -0.52;
    const bottom = P ? -2.83 : -1.75;

    const values = [
      23, 24, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35, 36, 37
    ];

    const observed = [
      23, 24, 25, 26, 27, 28
    ];

    const resampled = [
      23, 23, 24, 26, 28, 28
    ];

    const parts = [];

    parts.push(
      txt(
        'All kinds of deliveries',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.57, 0]
      ),

      txt(
        'Unrepresentative sample',
        P ? 21 : 19,
        GOLD,
        [CX, middle + 0.56, 0]
      ),

      txt(
        'Resampling copies the same flaw',
        P ? 21 : 19,
        MISS,
        [CX, bottom + 0.57, 0]
      )
    );

    values.forEach(v => {
      parts.push(glowDot(
        x(v),
        top,
        v <= 28 ? C.cyan : C.muted,
        P ? 0.073 : 0.057
      ));
    });

    observed.forEach(v => {
      parts.push(glowDot(
        x(v),
        middle,
        C.cyan,
        P ? 0.075 : 0.060
      ));
    });

    resampled.forEach((v, i) => {
      const repeat = resampled.slice(0, i)
        .filter(u => u === v).length;

      parts.push(glowDot(
        x(v),
        bottom + repeat * 0.20,
        C.violet,
        P ? 0.075 : 0.060
      ));
    });

    const boxL = x(28.6);
    const boxR = x(37.5);

    parts.push(
      outline(
        (boxL + boxR) / 2,
        middle,
        boxR - boxL,
        0.43,
        MISS
      ),

      outline(
        (boxL + boxR) / 2,
        bottom,
        boxR - boxL,
        0.43,
        MISS
      ),

      txt(
        'Missing slow deliveries',
        P ? 17 : 15,
        MISS,
        [(boxL + boxR) / 2, middle - 0.42, 0]
      ),

      txt(
        'Still missing',
        P ? 17 : 15,
        MISS,
        [(boxL + boxR) / 2, bottom - 0.43, 0]
      ),

      txt(
        'Illustrative example of sample bias',
        P ? 16 : 14,
        C.muted,
        [CX, bottom - 0.91, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ---------------------------------------------------------------
  // 0: So far, our nets needed a standard-error formula.
  // ---------------------------------------------------------------

  const formulaReminder = samplePicture({
    showMean: true,
    showNet: true,
    title: 'Our previous interval recipe'
  });

  await until(S(0));
  await play(
    ...picture(formulaReminder),
    ...say('SO FAR: NETS NEEDED A FORMULA'),
    ...fbox([
      'estimate ± margin',
      'margin = cut-off × SE',
      ['SE = SD ÷ √n', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 1: Some estimates, such as the median, do not have
  // a simple general standard-error formula.
  // ---------------------------------------------------------------

  const medianCards = originalCardsPicture({
    highlightMedian: true,
    title: 'What about the median?'
  });

  await until(S(1));
  await play(
    ...picture(medianCards),
    ...say('WHAT IF THERE IS NO SIMPLE SE FORMULA?', GOLD),
    ...fbox([
      ['Median = 30', C.green],
      'But how much would',
      'the median vary?',
      ['No simple general SE', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 2: Imagine drawing many real samples and watching
  // the estimate move.
  // ---------------------------------------------------------------

  const manySamples = manyRealSamples();

  await until(S(2));
  await play(
    ...picture(manySamples),
    ...say('IMAGINE MANY NEW SAMPLES'),
    ...fbox([
      'Draw a new sample.',
      'Calculate its estimate.',
      ['Watch how it varies.', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 3: Sami cannot drive the route ten thousand more times.
  // ---------------------------------------------------------------

  const expensive = expensiveSamplingPicture();

  await until(S(3));
  await play(
    ...picture(expensive),
    ...say('10,000 MORE REAL TRIPS? NOT PRACTICAL!', GOLD),
    ...fbox([
      'More real deliveries',
      'cost time and money.',
      ['We need another way.', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 4: Introduce the clever trick.
  // ---------------------------------------------------------------

  const original = originalCardsPicture();

  await until(S(4));
  await play(
    ...picture(original),
    ...say('USE THE DATA WE ALREADY HAVE', C.green),
    ...fbox([
      ['Our 16 observations', C.cyan],
      'Let the sample',
      'help itself.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 5: Write the sixteen delivery times on cards
  // and put the cards into a hat.
  // ---------------------------------------------------------------

  const fullHat = hatPicture({
    drawn: 0,
    caption: 'Sixteen cards in the hat'
  });

  await until(S(5));
  await play(
    ...picture(fullHat),
    ...say('ONE CARD FOR EACH DELIVERY'),
    ...fbox([
      '16 original deliveries',
      '16 separate cards',
      ['All go into the hat.', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 6: Draw one card and record its time.
  //
  // First seed-62 draw: original card index 7, value 30.
  // Animate that card from the hat to the recording tray.
  // ---------------------------------------------------------------

  const firstId = DRAW_IDS[0];
  const firstValue = DRAW[0];

  const firstDrawHat = hatPicture({
    drawn: 0,
    missingSource: firstId
  });

  const firstStart = hatSlot(firstId);

  const movingCard = card(
    firstValue,
    firstStart[0],
    firstStart[1],
    GOLD,
    CARD_W,
    CARD_H,
    P ? 18 : 17
  );

  await until(S(6));
  await play(
    ...picture(firstDrawHat),
    new M.FadeIn(movingCard),
    ...say('DRAW ONE CARD: 30', GOLD),
    ...fbox([
      ['First draw = 30', GOLD],
      'Record the time.'
    ], GOLD)
  );

  const firstTarget = drawnCard(0, GOLD);

  await play(
    new M.Transform(
      movingCard,
      firstTarget,
      { runTime: 0.55 }
    )
  );

  // ---------------------------------------------------------------
  // 7: Put the original card back.
  // Keep the recorded value in the resample.
  // ---------------------------------------------------------------

  const returnedHat = hatPicture({
    drawn: 1,
    highlightSource: firstId,
    showReplacement: true,
    caption: 'Record the value, return the card'
  });

  await until(S(7));
  await play(
    new M.FadeOut(movingCard),
    ...picture(returnedHat),
    ...say('PUT THE CARD BACK', C.green),
    ...fbox([
      'Recorded: 30',
      ['Card returned', C.green],
      '16 cards available'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 8: Draw again, replacing after every draw.
  // Repeat until sixteen values have been recorded.
  // ---------------------------------------------------------------

  const repeatHat = hatPicture({
    drawn: 1,
    showReplacement: true
  });

  const additionalDraws = DRAW.slice(1).map((_, k) =>
    drawnCard(k + 1, C.violet)
  );

  await until(S(8));
  await play(
    ...picture(repeatHat),
    ...say('SHAKE · DRAW · RECORD · RETURN'),
    ...fbox([
      'Draw one card.',
      'Record its value.',
      'Return it.',
      ['Repeat 16 times.', C.violet]
    ])
  );

  await play(
    new M.LaggedStart(
      additionalDraws.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.10,
        runTime: 1.65
      }
    )
  );

  // ---------------------------------------------------------------
  // 9: Name drawing with replacement.
  // The original sixteen cards are still available.
  // ---------------------------------------------------------------

  const replacement = hatPicture({
    drawn: 16,
    showReplacement: true,
    caption: 'The original cards are never used up'
  });

  await until(S(9));
  await play(
    ...fade(additionalDraws),
    ...picture(replacement),
    ...say('DRAWING WITH REPLACEMENT', C.green),
    ...fbox([
      ['With replacement', C.green],
      'Every drawn card',
      'goes back before',
      'the next draw.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 10: Replacement allows duplicates and omissions.
  // ---------------------------------------------------------------

  const repeatedHat = hatPicture({
    drawn: 16,
    showDuplicates: true,
    showMissing: true,
    caption: 'Some values repeat; others never appear'
  });

  await until(S(10));
  await play(
    ...picture(repeatedHat),
    ...say('REPEATS ARE ALLOWED; OMISSIONS TOO', GOLD),
    ...fbox([
      'Cards can come out',
      'more than once.',
      ['Some never appear.', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 11: Show the fixed seed-62 resample in sorted order.
  // ---------------------------------------------------------------

  const sortedDraw = comparisonCards();

  await until(S(11));
  await play(
    ...picture(sortedDraw),
    ...say('HERE IS ONE COMPLETE DRAW', C.violet),
    ...fbox([
      'Original: 16 values',
      ['New draw: 16 values', C.violet],
      'Shown in sorted order'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 12: Thirty and thirty-four each appear three times.
  // ---------------------------------------------------------------

  const repeatedValues = comparisonCards({
    highlightRepeated: true
  });

  await until(S(12));
  await play(
    ...picture(repeatedValues),
    ...say('30 APPEARS 3 TIMES · 34 APPEARS 3 TIMES', GOLD),
    ...fbox([
      ['30, 30, 30', GOLD],
      ['34, 34, 34', GOLD],
      'Replacement allows',
      'repeated values.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 13: Five original values did not appear in this resample.
  // ---------------------------------------------------------------

  const omittedValues = comparisonCards({
    highlightMissing: true
  });

  await until(S(13));
  await play(
    ...picture(omittedValues),
    ...say('SOME ORIGINAL VALUES NEVER CAME OUT', MISS),
    ...fbox([
      'Missing values:',
      ['23, 28, 29, 32, 37', MISS],
      'Still 16 values',
      'in the resample.'
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 14: Each particular original card has about a one-in-three
  // chance of being omitted from a sixteen-draw resample.
  // ---------------------------------------------------------------

  const missingChance = missingCardProbabilityPicture();

  await until(S(14));
  await play(
    ...picture(missingChance),
    ...say('A CARD HAS ABOUT A 1-IN-3 CHANCE OF BEING LEFT OUT', GOLD),
    ...fbox([
      'Miss one card per draw:',
      '15 ÷ 16',
      'Miss it 16 times:',
      ['(15/16)¹⁶ ≈ 36%', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 15: Name the new set of sixteen a resample.
  // ---------------------------------------------------------------

  const namedResample = comparisonCards({
    labelResample: 'Bootstrap resample'
  });

  await until(S(15));
  await play(
    ...picture(namedResample),
    ...say('RESAMPLE = A NEW DRAW FROM OUR DATA', C.violet),
    ...fbox([
      ['resample', C.violet],
      'Same sample size',
      'Drawn with replacement',
      'from the original data'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 16: The resample mean is 30.875, approximately 30.9.
  // The original mean remains 30.
  // ---------------------------------------------------------------

  const shiftedMean = sampleMeansComparison();

  await until(S(16));
  await play(
    ...picture(shiftedMean),
    ...say('THE RESAMPLE MEAN IS A LITTLE DIFFERENT', C.violet),
    ...fbox([
      ['Original: 480 ÷ 16 = 30', C.cyan],
      'Resample: 494 ÷ 16',
      '= 30.875',
      ['≈ 30.9 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 17: Repeat ten thousand times, calculating each resample mean.
  // ---------------------------------------------------------------

  const repeatedSamples = repeatResamplesPicture();

  await until(S(17));
  await play(
    ...picture(repeatedSamples),
    ...say('REPEAT 10,000 TIMES', C.violet),
    ...fbox([
      'Draw 16 with replacement.',
      'Calculate their mean.',
      ['Repeat 10,000 times.', C.violet],
      'Keep every mean.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 18: Stack the ten thousand means as a histogram.
  //
  // Fade in the axes, then build the actual frequency bars.
  // Bars remain individually tracked until the next picture.
  // ---------------------------------------------------------------

  const histBuild = histogramParts();

  await until(S(18));
  await play(
    ...picture(histBuild.base),
    ...say('STACK THE MEANS INTO A HISTOGRAM'),
    ...fbox([
      ['histogram', C.cyan],
      'Group nearby values.',
      'Bar height shows',
      'how often they appear.'
    ])
  );

  await play(
    new M.LaggedStart(
      histBuild.bars.map(b => new M.FadeIn(b)),
      {
        lagRatio: 0.10,
        runTime: 2.4
      }
    ),
    ...histBuild.extras.map(o => new M.FadeIn(o))
  );

  // ---------------------------------------------------------------
  // 19: The means form a pile around thirty.
  // ---------------------------------------------------------------

  const centredHistogram = histogramPicture({
    highlightCenter: true
  });

  await until(S(19));
  await play(
    ...fade([
      ...histBuild.bars,
      ...histBuild.extras
    ]),
    ...picture(centredHistogram),
    ...say('THE PILE IS CENTRED AROUND 30', C.violet),
    ...fbox([
      ['Original mean = 30', C.violet],
      'Resample means',
      'vary around it.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 20: The bootstrap pile stands in for the many real
  // samples Sami could not collect.
  // ---------------------------------------------------------------

  await until(S(20));
  await play(
    ...say('THIS PILE IMITATES REAL SAMPLE-TO-SAMPLE VARIATION'),
    ...fbox([
      'Real samples: unavailable',
      ['Bootstrap resamples:', C.violet],
      'An approximation to',
      'sampling variation'
    ])
  );

  // ---------------------------------------------------------------
  // 21: Name the bootstrap.
  // ---------------------------------------------------------------

  const bootstrapWorkflow = workflowPicture();

  await until(S(21));
  await play(
    ...picture(bootstrapWorkflow),
    ...say('THE BOOTSTRAP', C.violet),
    ...fbox([
      ['bootstrap', C.violet],
      'Resample your own data.',
      'Calculate the estimate.',
      'Repeat many times.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 22: The sample helps itself.
  // Explain the name without inventing a literal physical mechanism.
  // ---------------------------------------------------------------

  const selfHelpY = P ? -0.55 : -0.40;

  const sampleBox = new M.RoundedRectangle({
    width: 3.25,
    height: 1.65,
    cornerRadius: 0.16,
    color: C.cyan,
    strokeWidth: 2
  });

  sampleBox.setFill(C.card, 0.95);
  sampleBox.moveTo([CX, selfHelpY, 0]);

  const selfHelpDots = Array.from(
    { length: N },
    (_, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);

      return glowDot(
        CX + (col - 3.5) * 0.31,
        selfHelpY + 0.10 - row * 0.28,
        C.cyan,
        P ? 0.064 : 0.052
      );
    }
  );

  const selfHelpPicture = new M.VGroup(
    sampleBox,
    ...selfHelpDots,

    arrow(
      CX - 1.83,
      selfHelpY - 0.10,
      CX - 1.83,
      selfHelpY + 1.04,
      C.violet,
      2.5
    ),

    arrow(
      CX - 1.83,
      selfHelpY + 1.04,
      CX + 1.83,
      selfHelpY + 1.04,
      C.violet,
      2.5
    ),

    arrow(
      CX + 1.83,
      selfHelpY + 1.04,
      CX + 1.83,
      selfHelpY - 0.10,
      C.violet,
      2.5
    ),

    txt(
      'THE SAMPLE HELPS ITSELF',
      P ? 23 : 21,
      C.violet,
      [CX, selfHelpY + 1.65, 0],
      true
    ),

    txt(
      'Use the sample to study its own uncertainty',
      P ? 20 : 18,
      C.ink,
      [CX, selfHelpY - 1.34, 0]
    )
  );

  await until(S(22));
  await play(
    ...picture(selfHelpPicture),
    ...say('THE SAMPLE HELPS ITSELF', C.violet),
    ...fbox([
      '“Pull yourself up',
      'by your bootstraps.”',
      ['Our data help us', C.violet],
      ['study uncertainty.', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 23: Nonparametric means no assumed delivery-time distribution.
  // Use the sixteen observed times directly.
  // ---------------------------------------------------------------

  const empirical = empiricalPicture();

  await until(S(23));
  await play(
    ...picture(empirical),
    ...say('NONPARAMETRIC = NO ASSUMED CURVE SHAPE', C.green),
    ...fbox([
      ['Nonparametric bootstrap', C.green],
      'No fitted bell curve',
      'for delivery times.',
      'Use the observed values.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 24: Measure how wide the histogram is.
  // ---------------------------------------------------------------

  const spreadQuestion = histogramPicture({
    highlightCenter: true,
    showSpread: true,
    showValue: false,
    title: 'How much do the means vary?'
  });

  await until(S(24));
  await play(
    ...picture(spreadQuestion),
    ...say('MEASURE THE SPREAD OF THE PILE', GOLD),
    ...fbox([
      '10,000 resampled means',
      'How widely do',
      ['they spread out?', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 25: Standard deviation of the 10,000 bootstrap means
  // is approximately 0.98 minutes.
  // ---------------------------------------------------------------

  const measuredSpread = histogramPicture({
    highlightCenter: true,
    showSpread: true,
    showValue: true,
    title: 'Spread of the bootstrap means'
  });

  await until(S(25));
  await play(
    ...picture(measuredSpread),
    ...say('BOOTSTRAP STANDARD ERROR ≈ 0.98 MINUTES', C.violet),
    ...fbox([
      'Standard deviation',
      'of 10,000 means',
      ['≈ 0.98 minutes', C.violet],
      'Bootstrap SE'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 26: Recall the ordinary formula's standard error.
  // Four divided by four equals one minute.
  // ---------------------------------------------------------------

  const formulaComparison = seComparisonPicture('formula');

  await until(S(26));
  await play(
    ...picture(formulaComparison),
    ...say('THE FORMULA GAVE 1 MINUTE', C.cyan),
    ...fbox([
      'SE = SD ÷ √n',
      '   = 4 ÷ √16',
      '   = 4 ÷ 4',
      ['   = 1 minute', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 27: Bootstrap and formula give almost the same answer.
  // The bootstrap did not require a statistic-specific SE formula.
  // ---------------------------------------------------------------

  const almostEqual = seComparisonPicture('both');

  await until(S(27));
  await play(
    ...picture(almostEqual),
    ...say('ALMOST THE SAME STANDARD ERROR', C.green),
    ...fbox([
      ['Bootstrap ≈ 0.98 min', C.violet],
      ['Formula   = 1.00 min', C.cyan],
      'Nearly identical.',
      'No SE formula needed.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 28: Bootstrap standard error is the standard deviation
  // of an estimate across many resamples.
  // ---------------------------------------------------------------

  const bootstrapDefinition = histogramPicture({
    highlightCenter: true,
    showSpread: true,
    showValue: true,
    title: 'Bootstrap standard error'
  });

  await until(S(28));
  await play(
    ...picture(bootstrapDefinition),
    ...say('BOOTSTRAP SE = SPREAD OF RESAMPLED ESTIMATES', C.violet),
    ...fbox([
      ['bootstrap SE =', C.violet],
      'standard deviation',
      'of the estimates from',
      'many resamples'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 29: Estimate how much a statistic could vary
  // from sample to sample.
  // ---------------------------------------------------------------

  const usefulBootstrap = workflowPicture({
    showSpread: true,
    title: 'Measure sampling uncertainty'
  });

  await until(S(29));
  await play(
    ...picture(usefulBootstrap),
    ...say('MEASURE SAMPLE-TO-SAMPLE VARIATION', C.green),
    ...fbox([
      'How much might',
      'our estimate change',
      'with another sample?',
      ['Use the bootstrap.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 30: Means, medians, and ratios can use the same recipe.
  // ---------------------------------------------------------------

  const differentEstimates = estimatesPicture();

  await until(S(30));
  await play(
    ...picture(differentEstimates),
    ...say('MEAN · MEDIAN · RATIO: SAME RECIPE'),
    ...fbox([
      '1. Draw a resample.',
      '2. Compute the estimate.',
      '3. Repeat.',
      ['4. Measure its spread.', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 31: The sample is a small empirical picture of the route.
  // Drawing from it imitates drawing from the population.
  // ---------------------------------------------------------------

  const miniature = miniatureRoutePicture();

  await until(S(31));
  await play(
    ...picture(miniature),
    ...say('THE SAMPLE IS A SMALL PICTURE OF THE ROUTE', C.cyan),
    ...fbox([
      'The original sample',
      'stands in for the route.',
      ['Resampling imitates', C.violet],
      ['drawing new samples.', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 32: Common trap.
  // ---------------------------------------------------------------

  const trapPicture = new M.VGroup(
    txt(
      'MORE DATA?',
      P ? 32 : 29,
      GOLD,
      [CX, P ? 0.43 : 0.36, 0],
      true
    ),

    txt(
      'Or more copies of the same data?',
      P ? 22 : 20,
      C.ink,
      [CX, P ? -0.34 : -0.34, 0]
    ),

    txt(
      'These are not the same thing.',
      P ? 21 : 19,
      MISS,
      [CX, P ? -1.08 : -1.06, 0]
    )
  );

  await until(S(32));
  await play(
    ...picture(trapPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'More resamples do not',
      'mean more real data.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 33: The bootstrap cannot create new information.
  // ---------------------------------------------------------------

  const noNewInformation = comparisonCards();

  await until(S(33));
  await play(
    ...picture(noNewInformation),
    ...say('THE BOOTSTRAP CANNOT CREATE NEW INFORMATION', MISS),
    ...fbox([
      'Every resampled value',
      'comes from the original',
      ['16 observations.', C.cyan],
      'No new deliveries.'
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 34: If the original sample is tiny or unusual,
  // the resamples copy its flaws.
  // ---------------------------------------------------------------

  const copiedFlaws = flawedSamplePicture();

  await until(S(34));
  await play(
    ...picture(copiedFlaws),
    ...say('A FLAWED SAMPLE PRODUCES FLAWED RESAMPLES', MISS),
    ...fbox([
      'Tiny or unusual sample?',
      'Missing information?',
      ['Resampling copies', MISS],
      ['the same limitations.', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 35: No resample can contain a delivery slower than 37 minutes,
  // because 37 is the largest observed delivery time.
  // ---------------------------------------------------------------

  const maximumOnly = samplePicture({
    showMaximum: true,
    showBeyond: true,
    title: 'The limit of our observed data'
  });

  await until(S(35));
  await play(
    ...picture(maximumOnly),
    ...say('NO RESAMPLED DELIVERY CAN EXCEED 37 MINUTES', GOLD),
    ...fbox([
      ['Largest observation = 37', GOLD],
      'A resample can repeat it.',
      'But cannot invent',
      ['a slower delivery.', MISS]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 36: Next lesson — turn the bootstrap distribution
  // into a confidence interval.
  //
  // Preview without revealing the median's percentile endpoints.
  // ---------------------------------------------------------------

  const nextHistogram = histogramPicture({
    highlightCenter: true,
    title: 'From a bootstrap pile to a net'
  });

  await until(S(36));
  await play(
    ...picture(nextHistogram),
    ...say('NEXT: TURN THE BOOTSTRAP PILE INTO A NET'),
    ...fbox([
      'We have a pile of',
      'resampled estimates.',
      ['Next: read an interval', C.violet],
      ['from that pile.', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 37: Final one-sentence summary.
  //
  // Keep the full bootstrap workflow visible until narration ends.
  // ---------------------------------------------------------------

  const finalBootstrap = workflowPicture({
    statistic: 'estimate',
    showSpread: true,
    title: 'The nonparametric bootstrap'
  });

  await until(S(37));
  await play(
    ...picture(finalBootstrap),
    ...say('BOOTSTRAP = RESAMPLE YOUR OWN DATA WITH REPLACEMENT', C.green),
    ...fbox([
      ['Bootstrap', C.violet],
      'Resample with replacement.',
      'Calculate the estimate.',
      ['Measure how it varies.', C.green]
    ], C.green)
  );
}
