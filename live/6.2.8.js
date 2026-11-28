// lesson 6.2.8
// Cluster bootstrap — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Uses the fixed shared chapter data and the actual four-day grouping.
// The example resample is Tuesday, Thursday, Thursday, Monday.
//
// The comparison histograms are calculated from exact resampling
// distributions, using a common horizontal and vertical scale.
// The displayed 0.98-minute individual bootstrap SE is the checked
// simulation result from the earlier lesson, not the exact theoretical SE.
//
// All 256 ordered cluster resamples are enumerated in JavaScript.
// A deterministic 10,000-draw cluster simulation illustrates repetition.
// No external libraries are required.
//
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // ===============================================================
  // FIXED SHARED CHAPTER DATA
  // ===============================================================

  const D1 = [
    23, 25, 26, 26,
    27, 28, 29, 30,
    30, 31, 32, 33,
    34, 34, 35, 37
  ];

  const N = 16;
  const DAYS = 4;
  const PER_DAY = 4;

  const ORIGINAL_SUM = 480;
  const ORIGINAL_MEAN = 30;
  const ORIGINAL_MEDIAN = 30;

  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // Four distinct colours for the four actual observed days.
  // Gold remains available for warnings and known simulation truths.
  const DAY_COLORS = [
    C.cyan,
    C.green,
    C.violet,
    '#F472B6'
  ];

  const CLUSTERS = [
    {
      name: 'Monday',
      short: 'MON',
      values: [23, 25, 26, 26],
      mean: 25,
      sum: 100,
      color: DAY_COLORS[0]
    },

    {
      name: 'Tuesday',
      short: 'TUE',
      values: [27, 28, 29, 30],
      mean: 28.5,
      sum: 114,
      color: DAY_COLORS[1]
    },

    {
      name: 'Wednesday',
      short: 'WED',
      values: [30, 31, 32, 33],
      mean: 31.5,
      sum: 126,
      color: DAY_COLORS[2]
    },

    {
      name: 'Thursday',
      short: 'THU',
      values: [34, 34, 35, 37],
      mean: 35,
      sum: 140,
      color: DAY_COLORS[3]
    }
  ];

  // Fixed illustrative cluster resample from the narration.
  const DAY_DRAW = [1, 3, 3, 0];

  const CLUSTER_RESAMPLE = DAY_DRAW.flatMap(
    i => CLUSTERS[i].values
  );

  const CLUSTER_RESAMPLE_SUM = CLUSTER_RESAMPLE.reduce(
    (a, b) => a + b,
    0
  );

  const CLUSTER_RESAMPLE_MEAN =
    CLUSTER_RESAMPLE_SUM / N;

  // Same individual-delivery resample as in lesson 6.2.6.
  // This ordering is illustrative and keeps its exact multiset.
  const SINGLE_DRAW = [
    25, 30, 34, 26,
    35, 31, 30, 33,
    26, 34, 31, 27,
    35, 30, 33, 34
  ];

  // One valid source-card identity for each displayed individual draw.
  // Equal-valued cards remain separate original observations.
  const SINGLE_DRAW_IDS = [
    1, 7, 12, 2,
    14, 9, 8, 11,
    3, 13, 9, 4,
    14, 7, 11, 12
  ];

  const SINGLE_BOOTSTRAP_SE = 0.98;
  const CLUSTER_BOOTSTRAP_SE = 1.84;

  const SINGLE_LO = 28.1;
  const SINGLE_HI = 31.9;

  const CLUSTER_LO = 26.6;
  const CLUSTER_HI = 33.4;

  const SINGLE_WIDTH = SINGLE_HI - SINGLE_LO;
  const CLUSTER_WIDTH = CLUSTER_HI - CLUSTER_LO;

  const B = 10000;

  // 4 choices on each of 4 ordered draws.
  const POSSIBLE_CLUSTER_RESAMPLES =
    Math.pow(DAYS, DAYS);

  // ===============================================================
  // RESPONSIVE LAYOUT
  // ===============================================================

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

  const realX = v =>
    LEFT + (v - 22) / 16 * W;

  const meanX = v =>
    LEFT + (v - 24) / 12 * W;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const fadeAll = objects =>
    objects.map(o => new M.FadeOut(o));

  // ===============================================================
  // GENERAL VISUAL HELPERS
  // ===============================================================

  function txt(
    s,
    size,
    color,
    pos,
    mono = false,
    maxw = W
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pos);

    return t;
  }

  function ln(
    x1,
    y1,
    x2,
    y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
    });
  }

  function rect(
    w,
    h,
    x,
    y,
    color,
    opacity = 0.85,
    strokeWidth = 1
  ) {
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

  function outline(
    x,
    y,
    w,
    h,
    color = C.cyan,
    opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function glowDot(
    x,
    y,
    color = C.cyan,
    radius = 0.10
  ) {
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

  function axis(
    xmap,
    values,
    y,
    unit = 'minutes'
  ) {
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

  function bracket(
    x1,
    x2,
    y,
    color = C.muted,
    cap = 0.10
  ) {
    return new M.VGroup(
      ln(
        x1, y,
        x2, y,
        color, 3
      ),

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

  function net(
    xmap,
    lo,
    hi,
    y,
    color = C.cyan,
    cap = 0.15
  ) {
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

  function arrow(
    x1,
    y1,
    x2,
    y2,
    color = C.cyan,
    width = 2.5
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 0.16;
    const d = Math.PI / 6;

    return new M.VGroup(
      ln(
        x1, y1,
        x2, y2,
        color, width
      ),

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

    const t = txt(
      String(value),
      fontSize,
      color,
      [x, y, 0],
      true,
      w - 0.07
    );

    return new M.VGroup(r, t);
  }

  // ===============================================================
  // FORMULA BOX
  // ===============================================================

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

    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  // ===============================================================
  // MAIN PICTURE MANAGEMENT
  //
  // New groups contain only fresh objects.
  // Never regroup an object that is already visible.
  // ===============================================================

  let pictureNow = null;

  function picture(next) {
    const animations = [];

    if (pictureNow) {
      animations.push(new M.FadeOut(pictureNow));
    }

    if (next) {
      animations.push(new M.FadeIn(next));
    }

    pictureNow = next;

    return animations;
  }

  // ===============================================================
  // EXACT RESAMPLING DISTRIBUTIONS
  //
  // These distributions support the comparison pictures.
  // They are calculated rather than drawn as invented bell curves.
  // ===============================================================

  // Enumerate the 4^4 = 256 equally likely ordered day resamples.
  const ALL_CLUSTER_MEANS = [];

  for (let a = 0; a < DAYS; a++) {
    for (let b = 0; b < DAYS; b++) {
      for (let c = 0; c < DAYS; c++) {
        for (let d = 0; d < DAYS; d++) {
          const value = (
            CLUSTERS[a].mean +
            CLUSTERS[b].mean +
            CLUSTERS[c].mean +
            CLUSTERS[d].mean
          ) / DAYS;

          ALL_CLUSTER_MEANS.push(value);
        }
      }
    }
  }

  // Calculate the exact single-delivery bootstrap distribution
  // by repeatedly convolving the empirical distribution of D1.
  //
  // The map stores possible sums and their probabilities.
  // After sixteen draws, divide each possible sum by sixteen.
  //
  // Duplicate delivery times retain their empirical frequencies.
  function exactSingleDistribution() {
    let sums = new Map([[0, 1]]);

    for (let draw = 0; draw < N; draw++) {
      const next = new Map();

      for (const [sum, probability] of sums) {
        for (const value of D1) {
          const newSum = sum + value;

          next.set(
            newSum,
            (next.get(newSum) || 0) + probability / N
          );
        }
      }

      sums = next;
    }

    return Array.from(
      sums,
      ([sum, probability]) => ({
        value: sum / N,
        probability
      })
    ).sort((a, b) => a.value - b.value);
  }

  const SINGLE_DIST = exactSingleDistribution();

  // Exact cluster probability distribution.
  const CLUSTER_DIST = ALL_CLUSTER_MEANS.map(value => ({
    value,
    probability: 1 / POSSIBLE_CLUSTER_RESAMPLES
  }));

  function distributionSD(dist) {
    const total = dist.reduce(
      (s, d) => s + d.probability,
      0
    );

    const mean = dist.reduce(
      (s, d) => s + d.value * d.probability,
      0
    ) / total;

    const variance = dist.reduce(
      (s, d) =>
        s +
        d.probability * Math.pow(d.value - mean, 2),
      0
    ) / total;

    return Math.sqrt(variance);
  }

  const EXACT_SINGLE_SD =
    distributionSD(SINGLE_DIST);

  const EXACT_CLUSTER_SD =
    distributionSD(CLUSTER_DIST);

  // ---------------------------------------------------------------
  // Deterministic cluster simulation.
  //
  // A local seeded generator provides reproducible visual playback.
  // This is separate from the earlier NumPy seed-62 experiment.
  // ---------------------------------------------------------------

  function seededRandom(seed) {
    let state = seed >>> 0;

    return function () {
      state = (
        Math.imul(1664525, state) +
        1013904223
      ) >>> 0;

      return state / 4294967296;
    };
  }

  const random = seededRandom(628);

  const SIMULATED_CLUSTER_MEANS = [];

  for (let b = 0; b < B; b++) {
    let total = 0;

    for (let draw = 0; draw < DAYS; draw++) {
      const day = Math.floor(random() * DAYS);

      total += CLUSTERS[day].mean;
    }

    SIMULATED_CLUSTER_MEANS.push(total / DAYS);
  }

  const SIMULATED_CLUSTER_DIST =
    SIMULATED_CLUSTER_MEANS.map(value => ({
      value,
      probability: 1 / B
    }));

  // ---------------------------------------------------------------
  // Identical histogram bins for both distributions.
  //
  // Half-minute bins centred on 24, 24.5, ..., 36.
  // Bin height is probability mass, not a fitted density.
  // Very small omitted tails outside the displayed axis are not
  // renormalised.
  // ---------------------------------------------------------------

  const BIN_WIDTH = 0.5;
  const BIN_START = 24;
  const BIN_END = 36;

  const BIN_CENTERS = Array.from(
    {
      length:
        Math.round(
          (BIN_END - BIN_START) / BIN_WIDTH
        ) + 1
    },
    (_, i) => BIN_START + i * BIN_WIDTH
  );

  function binDistribution(dist) {
    const bins = BIN_CENTERS.map(() => 0);

    dist.forEach(({ value, probability }) => {
      const i = Math.floor(
        (
          value -
          BIN_START +
          BIN_WIDTH / 2
        ) / BIN_WIDTH
      );

      if (i >= 0 && i < bins.length) {
        bins[i] += probability;
      }
    });

    return bins;
  }

  const SINGLE_BINS =
    binDistribution(SINGLE_DIST);

  const CLUSTER_BINS =
    binDistribution(CLUSTER_DIST);

  const SIMULATION_BINS =
    binDistribution(SIMULATED_CLUSTER_DIST);

  const COMMON_MAX = Math.max(
    ...SINGLE_BINS,
    ...CLUSTER_BINS,
    ...SIMULATION_BINS
  );

  // ===============================================================
  // ORIGINAL DELIVERY DOT PICTURES
  // ===============================================================

  // All sixteen delivery dots, initially treated as separate values.
  // Day colours are revealed progressively.
  //
  // When grouped is true, each day occupies its own horizontal row.
  // The actual minutes scale remains unchanged.
  function deliveryPicture({
    coloredThrough = -1,
    grouped = false,
    highlightDay = -1,
    showMeans = false,
    showClusters = false,
    showDependence = false,
    title = '16 observed deliveries'
  } = {}) {
    const base = grouped
      ? P ? -3.58 : -2.18
      : AY;

    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        base
      ),

      txt(
        title,
        P ? 23 : 21,
        C.ink,
        [CX, P ? 1.16 : 1.17, 0]
      )
    ];

    const rowTop = P ? 0.40 : 0.55;
    const rowPitch = P ? 0.95 : 0.59;

    CLUSTERS.forEach((day, d) => {
      const revealed = d <= coloredThrough;

      const color = revealed
        ? day.color
        : C.muted;

      const rowY = rowTop - d * rowPitch;

      const first = day.values[0];
      const last = day.values[3];

      if (grouped) {
        parts.push(ln(
          LEFT,
          rowY,
          RIGHT,
          rowY,
          C.muted,
          0.55
        ));

        if (showClusters && revealed) {
          const lo = realX(first) - 0.18;
          const hi = realX(last) + 0.18;

          parts.push(outline(
            (lo + hi) / 2,
            rowY + 0.08,
            hi - lo,
            P ? 0.62 : 0.45,
            day.color,
            0.065
          ));
        }

        if (showDependence && revealed) {
          parts.push(
            ln(
              realX(first),
              rowY,
              realX(last),
              rowY,
              day.color,
              3
            )
          );
        }
      }

      day.values.forEach((v, j) => {
        const originalIndex = d * 4 + j;

        const repeat = grouped
          ? day.values.slice(0, j)
              .filter(u => u === v).length
          : D1.slice(0, originalIndex)
              .filter(u => u === v).length;

        const y = grouped
          ? rowY + repeat * (P ? 0.23 : 0.17)
          : base + 0.25 + repeat * 0.32;

        const dotColor = coloredThrough < 0
          ? C.cyan
          : color;

        parts.push(glowDot(
          realX(v),
          y,
          dotColor,
          P ? 0.085 : 0.078
        ));
      });

      if (grouped && revealed) {
        const labelY = rowY + (P ? 0.32 : 0.25);

        const labelX =
          CX - W * 0.38;

        parts.push(txt(
          day.short,
          P ? 15 : 13,
          day.color,
          [labelX, labelY, 0],
          true,
          W * 0.20
        ));

        if (showMeans) {
          const y = rowY - (P ? 0.31 : 0.23);

          parts.push(
            ln(
              realX(day.mean),
              rowY - 0.12,
              realX(day.mean),
              rowY + 0.13,
              day.color,
              2.5
            ),

            txt(
              `mean ${day.mean}`,
              P ? 16 : 14,
              day.color,
              [
                Math.max(
                  LEFT + 0.53,
                  Math.min(
                    RIGHT - 0.53,
                    realX(day.mean)
                  )
                ),
                y,
                0
              ],
              true,
              1.15
            )
          );
        }
      }

      if (highlightDay === d) {
        const lo = realX(first) - 0.21;
        const hi = realX(last) + 0.21;

        if (!grouped) {
          parts.push(
            outline(
              (lo + hi) / 2,
              base + 0.52,
              hi - lo,
              1.00,
              day.color,
              0.05
            ),

            txt(
              day.name,
              P ? 22 : 20,
              day.color,
              [
                Math.max(
                  LEFT + 0.75,
                  Math.min(
                    RIGHT - 0.75,
                    realX(day.mean)
                  )
                ),
                base + 1.24,
                0
              ]
            ),

            txt(
              `mean = ${day.mean}`,
              P ? 20 : 18,
              day.color,
              [
                Math.max(
                  LEFT + 0.75,
                  Math.min(
                    RIGHT - 0.75,
                    realX(day.mean)
                  )
                ),
                base + 1.69,
                0
              ],
              true
            )
          );
        }
      }
    });

    return new M.VGroup(...parts);
  }

  // Four day groups, each containing four observations.
  // The initial version reveals the grouping before revealing values.
  function fourDaysPicture({
    showValues = true,
    colored = true,
    showMeans = false,
    showInformation = false
  } = {}) {
    const top = P ? 0.56 : 0.71;
    const rowPitch = P ? 1.05 : 0.70;

    const parts = [];

    CLUSTERS.forEach((day, d) => {
      const y = top - d * rowPitch;

      const color = colored
        ? day.color
        : C.cyan;

      parts.push(
        outline(
          CX,
          y,
          W - 0.28,
          rowPitch * 0.79,
          color,
          0.055
        ),

        txt(
          day.name,
          P ? 19 : 17,
          color,
          [CX - W * 0.32, y, 0],
          false,
          W * 0.26
        )
      );

      day.values.forEach((v, j) => {
        const x =
          CX - W * 0.07 +
          j * W * 0.105;

        if (showValues) {
          parts.push(card(
            v,
            x,
            y,
            color,
            W * 0.085,
            P ? 0.48 : 0.36,
            P ? 18 : 16
          ));
        } else {
          parts.push(glowDot(
            x,
            y,
            color,
            P ? 0.105 : 0.080
          ));
        }
      });

      if (showMeans) {
        parts.push(txt(
          String(day.mean),
          P ? 19 : 17,
          color,
          [CX + W * 0.385, y, 0],
          true,
          W * 0.16
        ));
      }
    });

    if (showMeans) {
      parts.push(txt(
        'mean',
        P ? 15 : 13,
        C.muted,
        [
          CX + W * 0.385,
          top + rowPitch * 0.59,
          0
        ]
      ));
    }

    parts.push(txt(
      'Four deliveries on each day',
      P ? 22 : 20,
      C.ink,
      [CX, top + 0.67, 0]
    ));

    if (showInformation) {
      const bottom =
        top - (DAYS - 1) * rowPitch;

      parts.push(
        txt(
          '16 observations',
          P ? 22 : 20,
          C.cyan,
          [CX, bottom - 0.75, 0]
        ),

        txt(
          'Only 4 sampled days',
          P ? 25 : 22,
          GOLD,
          [CX, bottom - 1.20, 0]
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // TRAFFIC AND DEPENDENCE
  // ===============================================================

  // A schematic road and small car.
  // The traffic illustration explains shared conditions.
  // It does not assert a measured traffic count for any actual day.
  function car(x, y, color, size = 1) {
    const w = 0.58 * size;
    const h = 0.27 * size;

    const body = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.05,
      color,
      strokeWidth: 1.4
    });

    body.setFill(color, 0.65);
    body.moveTo([x, y, 0]);

    const roof = new M.RoundedRectangle({
      width: w * 0.58,
      height: h * 0.70,
      cornerRadius: 0.05,
      color,
      strokeWidth: 1.2
    });

    roof.setFill(color, 0.30);
    roof.moveTo([x, y + h * 0.65, 0]);

    const wheels = [-1, 1].map(side => {
      const d = new M.Dot({
        point: [
          x + side * w * 0.30,
          y - h * 0.55,
          0
        ],
        radius: 0.065 * size,
        color: C.ink
      });

      d.setFill(C.ink, 1);

      return d;
    });

    return new M.VGroup(
      body,
      roof,
      ...wheels
    );
  }

  function trafficPicture() {
    const parts = [];

    const upperY = P ? 0.34 : 0.40;
    const lowerY = P ? -2.16 : -1.28;

    const roadW = W - 0.22;
    const roadH = P ? 0.63 : 0.48;

    const examples = [
      {
        y: upperY,
        label: 'Calm day',
        color: DAY_COLORS[0],
        cars: 3,
        positions: [-2.10, -0.15, 1.95],
        note: 'Deliveries tend to be faster'
      },

      {
        y: lowerY,
        label: 'Busy day',
        color: DAY_COLORS[3],
        cars: 7,
        positions: [
          -2.35, -1.57, -0.79,
          0, 0.79, 1.57, 2.35
        ],
        note: 'Deliveries tend to be slower'
      }
    ];

    examples.forEach((item, i) => {
      const { y, label, color, positions, note } = item;

      parts.push(
        rect(
          roadW,
          roadH,
          CX,
          y,
          C.muted,
          0.10,
          1
        ),

        ln(
          CX - roadW / 2,
          y - roadH / 2,
          CX + roadW / 2,
          y - roadH / 2,
          C.muted,
          2
        ),

        ln(
          CX - roadW / 2,
          y + roadH / 2,
          CX + roadW / 2,
          y + roadH / 2,
          C.muted,
          2
        ),

        txt(
          label,
          P ? 23 : 21,
          color,
          [CX, y + 0.75, 0]
        )
      );

      positions.forEach(dx => {
        parts.push(car(
          CX + dx,
          y - 0.035,
          color,
          P ? 0.85 : 0.76
        ));
      });

      const dotY = y - (P ? 0.73 : 0.54);

      for (let j = 0; j < 4; j++) {
        parts.push(glowDot(
          CX + (j - 1.5) * 0.48,
          dotY,
          color,
          P ? 0.075 : 0.060
        ));
      }

      if (P) {
        parts.push(txt(
          note,
          19,
          color,
          [CX, y - 1.13, 0]
        ));
      }
    });

    if (P) {
      parts.push(txt(
        'Illustrative traffic conditions',
        16,
        C.muted,
        [CX, -4.05, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // Four clusters of dependent observations.
  // All dots inside a cluster share a common colour and enclosure.
  function dependencePicture({
    showTitle = true,
    showLabels = false,
    countGroups = false
  } = {}) {
    const parts = [];

    const dx = P ? 2.80 : 2.75;
    const dy = P ? 1.68 : 1.23;

    const top = P ? 0.30 : 0.35;

    CLUSTERS.forEach((day, d) => {
      const col = d % 2;
      const row = Math.floor(d / 2);

      const x = CX + (col - 0.5) * dx;
      const y = top - row * dy;

      const dotPitch = P ? 0.38 : 0.37;

      parts.push(
        outline(
          x,
          y,
          dx * 0.87,
          P ? 1.15 : 0.94,
          day.color,
          0.055
        ),

        ln(
          x - 1.5 * dotPitch,
          y - 0.10,
          x + 1.5 * dotPitch,
          y - 0.10,
          day.color,
          2.6
        )
      );

      for (let j = 0; j < PER_DAY; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * dotPitch,
          y - 0.10,
          day.color,
          P ? 0.11 : 0.085
        ));
      }

      parts.push(txt(
        day.name,
        P ? 19 : 17,
        day.color,
        [x, y + 0.30, 0],
        false,
        dx * 0.78
      ));

      if (showLabels) {
        parts.push(txt(
          'one cluster',
          P ? 15 : 13,
          day.color,
          [x, y - 0.36, 0]
        ));
      }

      if (countGroups) {
        parts.push(txt(
          String(d + 1),
          P ? 17 : 15,
          C.ink,
          [x - dx * 0.34, y + 0.30, 0],
          true
        ));
      }
    });

    if (showTitle) {
      parts.push(txt(
        'Values within a day are related',
        P ? 22 : 20,
        C.ink,
        [CX, top + 0.91, 0]
      ));
    }

    parts.push(txt(
      countGroups
        ? '4 clusters, not 16 independent days'
        : 'Keep the shared conditions together',
      P ? 20 : 18,
      countGroups ? GOLD : C.violet,
      [
        CX,
        top - dy - (P ? 1.00 : 0.79),
        0
      ]
    ));

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // INDIVIDUAL-DELIVERY BOOTSTRAP: WHAT GOES WRONG
  // ===============================================================

  // Original grouped observations versus a freely mixed resample.
  // Each resampled card retains the colour of its source day.
  function mixedDaysPicture({
    showWarning = false,
    showConnections = false
  } = {}) {
    const parts = [];

    const top = P ? 0.48 : 0.55;
    const lower = P ? -1.94 : -1.10;

    const groupDX = W / 4.2;
    const dotDX = groupDX * 0.19;

    CLUSTERS.forEach((day, d) => {
      const x = CX + (d - 1.5) * groupDX;

      parts.push(
        outline(
          x,
          top,
          groupDX * 0.91,
          P ? 0.66 : 0.53,
          day.color,
          0.07
        ),

        txt(
          day.short,
          P ? 16 : 14,
          day.color,
          [x, top + 0.53, 0],
          true
        )
      );

      for (let j = 0; j < PER_DAY; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * dotDX,
          top,
          day.color,
          P ? 0.064 : 0.052
        ));
      }
    });

    parts.push(txt(
      'Original observations grouped by day',
      P ? 20 : 18,
      C.ink,
      [CX, top + 0.91, 0]
    ));

    parts.push(arrow(
      CX,
      top - 0.52,
      CX,
      lower + 0.84,
      C.muted,
      2.4
    ));

    const dx = P ? 0.70 : 0.69;
    const dy = P ? 0.55 : 0.44;

    SINGLE_DRAW.forEach((v, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);

      const x = CX + (col - 3.5) * dx;
      const y = lower - row * dy;

      const sourceDay = Math.floor(
        SINGLE_DRAW_IDS[i] / PER_DAY
      );

      parts.push(card(
        v,
        x,
        y,
        DAY_COLORS[sourceDay],
        dx * 0.86,
        dy * 0.82,
        P ? 19 : 17
      ));
    });

    if (showConnections) {
      [0, 3, 6, 9, 12, 15].forEach(i => {
        const sourceDay = Math.floor(
          SINGLE_DRAW_IDS[i] / PER_DAY
        );

        const sx =
          CX + (sourceDay - 1.5) * groupDX;

        const tx =
          CX + (i % 8 - 3.5) * dx;

        const targetY =
          lower -
          Math.floor(i / 8) * dy;

        parts.push(
          new M.DashedLine({
            start: [
              sx,
              top - 0.36,
              0
            ],

            end: [
              tx,
              targetY + dy * 0.43,
              0
            ],

            color: DAY_COLORS[sourceDay]
          })
        );
      });
    }

    parts.push(txt(
      'Individual cards mixed freely',
      P ? 21 : 19,
      C.violet,
      [CX, lower + 0.52, 0]
    ));

    const bottom = lower - dy;

    parts.push(txt(
      showWarning
        ? 'The original days have been broken apart'
        : '16 resampled delivery values',
      P ? 20 : 18,
      showWarning ? MISS : C.muted,
      [CX, bottom - 0.63, 0]
    ));

    return new M.VGroup(...parts);
  }

  // Daily means compared with a pooled mean.
  // Highlights the between-day variation that individual
  // resampling fails to reproduce appropriately.
  function daySwingPicture() {
    const top = P ? 0.55 : 0.62;
    const pitch = P ? 0.88 : 0.57;

    const base = P ? -3.60 : -2.20;

    const parts = [
      axis(
        realX,
        [22, 26, 30, 34, 38],
        base
      ),

      new M.DashedLine({
        start: [
          realX(ORIGINAL_MEAN),
          base,
          0
        ],

        end: [
          realX(ORIGINAL_MEAN),
          top + 0.30,
          0
        ],

        color: C.violet
      }),

      txt(
        'Overall sample mean = 30',
        P ? 21 : 19,
        C.violet,
        [CX, top + 0.72, 0]
      )
    ];

    CLUSTERS.forEach((day, d) => {
      const y = top - d * pitch;

      parts.push(
        ln(
          realX(ORIGINAL_MEAN),
          y,
          realX(day.mean),
          y,
          day.color,
          3
        ),

        glowDot(
          realX(day.mean),
          y,
          day.color,
          P ? 0.10 : 0.080
        ),

        txt(
          day.short,
          P ? 16 : 14,
          day.color,
          [LEFT + 0.35, y, 0],
          true
        ),

        txt(
          String(day.mean),
          P ? 20 : 18,
          day.color,
          [
            realX(day.mean),
            y + 0.32,
            0
          ],
          true
        )
      );
    });

    const bracketY = P ? -2.95 : -1.67;

    parts.push(
      bracket(
        realX(25),
        realX(35),
        bracketY,
        GOLD,
        0.10
      ),

      txt(
        '10-minute swing between days',
        P ? 18 : 16,
        GOLD,
        [CX, bracketY - 0.30, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // WHOLE-DAY CARDS
  //
  // Each physical card represents one entire day.
  // Its four observations are kept together inside the card.
  // ===============================================================

  function dayCard(
    dayIndex,
    x,
    y,
    w = 2.45,
    h = 1.17,
    {
      showValues = true,
      showMean = false,
      compact = false
    } = {}
  ) {
    const day = CLUSTERS[dayIndex];

    const parts = [];

    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color: day.color,
      strokeWidth: 2.2
    });

    r.setFill(C.card, 0.95);
    r.moveTo([x, y, 0]);

    parts.push(
      r,

      txt(
        compact ? day.short : day.name,
        compact
          ? P ? 18 : 16
          : P ? 22 : 20,
        day.color,
        [x, y + h * 0.30, 0],
        compact,
        w * 0.86
      )
    );

    const valueDX = w * 0.205;
    const valueY = y - h * 0.08;

    day.values.forEach((v, j) => {
      const px =
        x + (j - 1.5) * valueDX;

      if (showValues) {
        parts.push(
          card(
            v,
            px,
            valueY,
            day.color,
            valueDX * 0.89,
            h * 0.29,
            compact
              ? P ? 15 : 13
              : P ? 18 : 16
          )
        );
      } else {
        parts.push(glowDot(
          px,
          valueY,
          day.color,
          compact ? 0.052 : 0.070
        ));
      }
    });

    if (showMean) {
      parts.push(txt(
        `mean ${day.mean}`,
        compact
          ? P ? 15 : 13
          : P ? 18 : 16,
        day.color,
        [x, y - h * 0.34, 0],
        true,
        w * 0.84
      ));
    } else {
      parts.push(txt(
        '4 deliveries',
        compact ? 13 : 15,
        C.muted,
        [x, y - h * 0.34, 0],
        false,
        w * 0.84
      ));
    }

    return new M.VGroup(...parts);
  }

  function dayCardsPicture({
    showMean = false,
    compact = false,
    title = 'Four whole-day cards'
  } = {}) {
    const parts = [];

    const dx = P ? 2.85 : 2.80;
    const dy = P ? 1.51 : 1.21;

    const top = P ? 0.23 : 0.35;

    const w = dx * 0.88;
    const h = P ? 1.20 : 1.02;

    for (let d = 0; d < DAYS; d++) {
      const col = d % 2;
      const row = Math.floor(d / 2);

      parts.push(dayCard(
        d,
        CX + (col - 0.5) * dx,
        top - row * dy,
        w,
        h,
        {
          showValues: true,
          showMean,
          compact
        }
      ));
    }

    parts.push(
      txt(
        title,
        P ? 23 : 21,
        C.ink,
        [CX, top + h / 2 + 0.44, 0]
      ),

      txt(
        'One card = all four deliveries from one day',
        P ? 20 : 18,
        C.violet,
        [CX, top - dy - h / 2 - 0.52, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // DRAWING WHOLE DAYS WITH REPLACEMENT
  // ===============================================================

  const SOURCE_X = CX - 1.67;
  const TRAY_X = CX + 1.67;

  const DAY_CARD_W = P ? 2.65 : 2.60;
  const DAY_CARD_H = P ? 0.83 : 0.62;

  const DRAW_TOP = P ? 0.38 : 0.51;
  const DRAW_PITCH = P ? 1.01 : 0.73;

  function daySlot(center, i) {
    return [
      center,
      DRAW_TOP - i * DRAW_PITCH,
      0
    ];
  }

  function drawCardAt(
    dayIndex,
    center,
    slotIndex
  ) {
    const p = daySlot(center, slotIndex);

    return dayCard(
      dayIndex,
      p[0],
      p[1],
      DAY_CARD_W,
      DAY_CARD_H,
      {
        showValues: false,
        showMean: false,
        compact: true
      }
    );
  }

  function dayHatPicture({
    drawn = 0,
    showReplacement = true,
    highlightRepeat = false,
    showEmptySlots = true
  } = {}) {
    const parts = [];

    const top =
      DRAW_TOP + DAY_CARD_H / 2 + 0.12;

    const bottom =
      DRAW_TOP -
      3 * DRAW_PITCH -
      DAY_CARD_H / 2 -
      0.12;

    const sourceW = DAY_CARD_W + 0.20;

    // Hat outline: open rim with a visible card compartment.
    parts.push(
      ln(
        SOURCE_X - sourceW / 2 - 0.12,
        top,
        SOURCE_X + sourceW / 2 + 0.12,
        top,
        GOLD,
        3.2
      ),

      ln(
        SOURCE_X - sourceW / 2,
        top,
        SOURCE_X - sourceW / 2 + 0.06,
        bottom,
        GOLD,
        2
      ),

      ln(
        SOURCE_X + sourceW / 2,
        top,
        SOURCE_X + sourceW / 2 - 0.06,
        bottom,
        GOLD,
        2
      ),

      ln(
        SOURCE_X - sourceW / 2 + 0.06,
        bottom,
        SOURCE_X + sourceW / 2 - 0.06,
        bottom,
        GOLD,
        2
      ),

      outline(
        TRAY_X,
        (top + bottom) / 2,
        sourceW,
        top - bottom,
        C.violet
      ),

      txt(
        'DAY CARDS',
        P ? 18 : 16,
        GOLD,
        [SOURCE_X, top + 0.47, 0],
        true,
        2.7
      ),

      txt(
        'RESAMPLE',
        P ? 18 : 16,
        C.violet,
        [TRAY_X, top + 0.47, 0],
        true,
        2.7
      )
    );

    for (let i = 0; i < DAYS; i++) {
      parts.push(drawCardAt(
        i,
        SOURCE_X,
        i
      ));

      if (i < drawn) {
        parts.push(drawCardAt(
          DAY_DRAW[i],
          TRAY_X,
          i
        ));

        if (
          highlightRepeat &&
          (i === 1 || i === 2)
        ) {
          const p = daySlot(TRAY_X, i);

          parts.push(outline(
            p[0],
            p[1],
            DAY_CARD_W + 0.12,
            DAY_CARD_H + 0.09,
            DAY_COLORS[3]
          ));
        }
      } else if (showEmptySlots) {
        const p = daySlot(TRAY_X, i);

        parts.push(outline(
          p[0],
          p[1],
          DAY_CARD_W,
          DAY_CARD_H,
          C.muted
        ));
      }
    }

    if (showReplacement) {
      parts.push(
        arrow(
          SOURCE_X + 0.62,
          top + 0.12,
          TRAY_X - 0.62,
          top + 0.12,
          C.violet,
          2
        ),

        arrow(
          TRAY_X - 0.62,
          bottom - 0.18,
          SOURCE_X + 0.62,
          bottom - 0.18,
          C.green,
          2
        )
      );
    }

    parts.push(
      txt(
        '4 available',
        P ? 17 : 15,
        C.cyan,
        [SOURCE_X, bottom - 0.53, 0],
        true
      ),

      txt(
        `${drawn} drawn`,
        P ? 17 : 15,
        C.violet,
        [TRAY_X, bottom - 0.53, 0],
        true
      )
    );

    if (P) {
      parts.push(txt(
        'Return each whole card after drawing',
        19,
        C.green,
        [CX, bottom - 0.99, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // EXPAND THE FOUR DRAWN DAY CARDS
  //
  // Tuesday, Thursday, Thursday, Monday.
  //
  // Each resampled day retains all four delivery values.
  // Thursday appears twice as two distinct sampled clusters.
  // ===============================================================

  function expandedResamplePicture({
    showValues = true,
    showCount = false,
    showMeans = false,
    showCalculation = false
  } = {}) {
    const parts = [];

    const top = P ? 0.66 : 0.79;
    const pitch = P ? 0.96 : 0.61;

    DAY_DRAW.forEach((dayIndex, i) => {
      const day = CLUSTERS[dayIndex];
      const y = top - i * pitch;

      parts.push(
        outline(
          CX,
          y,
          W - 0.28,
          pitch * 0.79,
          day.color,
          0.055
        ),

        txt(
          String(i + 1),
          P ? 15 : 13,
          C.muted,
          [LEFT + 0.22, y, 0],
          true
        ),

        txt(
          day.name,
          P ? 19 : 17,
          day.color,
          [CX - W * 0.29, y, 0],
          false,
          W * 0.23
        )
      );

      day.values.forEach((v, j) => {
        const x =
          CX - W * 0.06 +
          j * W * 0.103;

        if (showValues) {
          parts.push(card(
            v,
            x,
            y,
            day.color,
            W * 0.083,
            P ? 0.49 : 0.35,
            P ? 18 : 16
          ));
        } else {
          parts.push(glowDot(
            x,
            y,
            day.color,
            P ? 0.10 : 0.075
          ));
        }
      });

      if (showMeans) {
        parts.push(txt(
          String(day.mean),
          P ? 19 : 17,
          day.color,
          [CX + W * 0.385, y, 0],
          true,
          W * 0.15
        ));
      }
    });

    const bottom = top - 3 * pitch;

    parts.push(txt(
      'One whole-day resample',
      P ? 23 : 21,
      C.ink,
      [CX, top + 0.62, 0]
    ));

    if (showCount) {
      parts.push(txt(
        '4 days × 4 deliveries = 16',
        P ? 23 : 21,
        C.green,
        [CX, bottom - 0.64, 0],
        true
      ));
    }

    if (showCalculation) {
      parts.push(
        txt(
          '28.5 + 35 + 35 + 25',
          P ? 22 : 20,
          C.ink,
          [CX, bottom - 0.65, 0],
          true
        ),

        txt(
          '÷ 4 = 30.875',
          P ? 24 : 22,
          C.violet,
          [CX, bottom - 1.10, 0],
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // Same fixed resample on a minutes line.
  // Four rows correspond to the four drawn day cards.
  function groupedResampleDots({
    showMean = false
  } = {}) {
    const parts = [];

    const top = P ? 0.66 : 0.67;
    const pitch = P ? 0.87 : 0.53;

    const base = P ? -3.55 : -2.20;

    parts.push(axis(
      realX,
      [22, 26, 30, 34, 38],
      base
    ));

    DAY_DRAW.forEach((dayIndex, i) => {
      const day = CLUSTERS[dayIndex];
      const y = top - i * pitch;

      const lo =
        realX(Math.min(...day.values)) - 0.15;

      const hi =
        realX(Math.max(...day.values)) + 0.15;

      parts.push(
        outline(
          (lo + hi) / 2,
          y + 0.06,
          hi - lo,
          P ? 0.60 : 0.43,
          day.color,
          0.06
        ),

        txt(
          `${i + 1}: ${day.short}`,
          P ? 15 : 13,
          day.color,
          [
            LEFT + 0.48,
            y + 0.17,
            0
          ],
          true,
          1.05
        )
      );

      day.values.forEach((v, j) => {
        const repeat = day.values.slice(0, j)
          .filter(u => u === v).length;

        parts.push(glowDot(
          realX(v),
          y + repeat * (P ? 0.24 : 0.17),
          day.color,
          P ? 0.087 : 0.073
        ));
      });
    });

    if (showMean) {
      const x = realX(
        CLUSTER_RESAMPLE_MEAN
      );

      parts.push(
        new M.DashedLine({
          start: [x, base, 0],
          end: [x, top + 0.45, 0],
          color: C.violet
        }),

        glowDot(
          x,
          base + 0.18,
          C.violet,
          0.11
        ),

        txt(
          'resample mean ≈ 30.9',
          P ? 22 : 20,
          C.violet,
          [CX, top + 0.66, 0],
          true
        )
      );
    } else {
      parts.push(txt(
        '16 values, still in four day groups',
        P ? 22 : 20,
        C.ink,
        [CX, top + 0.66, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // REPEAT THE CLUSTER BOOTSTRAP
  //
  // Each illustrative row is a valid ordered sequence
  // of four day cards.
  // The resulting means are calculated from the actual day means.
  // ===============================================================

  function repeatedDayDrawsPicture() {
    const examples = [
      DAY_DRAW,
      [0, 0, 1, 2],
      [3, 2, 3, 1],
      [1, 2, 0, 2]
    ];

    const top = P ? 0.63 : 0.76;
    const pitch = P ? 0.99 : 0.69;

    const parts = [];

    examples.forEach((sequence, row) => {
      const y = top - row * pitch;

      parts.push(txt(
        String(row + 1),
        P ? 16 : 14,
        C.muted,
        [LEFT + 0.16, y, 0],
        true
      ));

      sequence.forEach((d, i) => {
        const x =
          CX - 1.78 +
          i * 0.79;

        const day = CLUSTERS[d];

        parts.push(
          outline(
            x,
            y,
            0.71,
            P ? 0.66 : 0.50,
            day.color,
            0.07
          ),

          txt(
            day.short,
            P ? 13 : 12,
            day.color,
            [x, y + 0.15, 0],
            true,
            0.60
          )
        );

        for (let j = 0; j < PER_DAY; j++) {
          parts.push(glowDot(
            x + (j - 1.5) * 0.11,
            y - 0.11,
            day.color,
            P ? 0.034 : 0.028
          ));
        }
      });

      const mean = sequence.reduce(
        (sum, d) => sum + CLUSTERS[d].mean,
        0
      ) / DAYS;

      parts.push(
        arrow(
          CX + 0.98,
          y,
          CX + 1.45,
          y,
          C.muted,
          1.8
        ),

        glowDot(
          CX + 1.72,
          y,
          C.violet,
          P ? 0.075 : 0.060
        ),

        txt(
          mean.toFixed(1),
          P ? 22 : 20,
          C.violet,
          [CX + 2.28, y, 0],
          true
        )
      );
    });

    parts.push(
      txt(
        'FOUR DAY CARDS → ONE MEAN',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.57, 0],
        true
      ),

      txt(
        '⋮',
        P ? 26 : 23,
        C.muted,
        [CX, top - 3 * pitch - 0.40, 0]
      ),

      txt(
        'Repeat 10,000 times',
        P ? 24 : 22,
        C.violet,
        [CX, top - 3 * pitch - 0.84, 0],
        true
      ),

      txt(
        'Illustrative ordered draws',
        P ? 16 : 14,
        C.muted,
        [CX, top - 3 * pitch - 1.20, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // CLUSTER BOOTSTRAP HISTOGRAM
  //
  // A single histogram can display either the deterministic
  // simulation or the exact cluster distribution.
  // ===============================================================

  function clusterHistogram({
    simulated = true,
    title = ''
  } = {}) {
    const bins = simulated
      ? SIMULATION_BINS
      : CLUSTER_BINS;

    const parts = [];

    const base = P ? -3.25 : -1.88;
    const height = P ? 3.55 : 2.33;

    const maxBin = Math.max(...bins);
    const scale = height / maxBin;

    const barW =
      (meanX(30.5) - meanX(30)) * 0.87;

    const maxPercent =
      Math.ceil(maxBin * 100 / 5) * 5;

    for (
      let percent = 5;
      percent <= maxPercent;
      percent += 5
    ) {
      const y =
        base +
        percent / 100 * scale;

      if (y > base + height + 0.12) {
        continue;
      }

      parts.push(
        ln(
          LEFT,
          y,
          RIGHT,
          y,
          C.muted,
          0.6
        ),

        txt(
          `${percent}%`,
          P ? 12 : 11,
          C.muted,
          [LEFT - 0.30, y, 0],
          true,
          0.58
        )
      );
    }

    parts.push(
      axis(
        meanX,
        [24, 26, 28, 30, 32, 34, 36],
        base,
        'resample mean (minutes)'
      ),

      ln(
        LEFT,
        base,
        LEFT,
        base + height + 0.12,
        C.muted,
        2
      )
    );

    bins.forEach((probability, i) => {
      if (probability <= 0) return;

      const h = probability * scale;

      parts.push(rect(
        barW,
        Math.max(0.001, h),
        meanX(BIN_CENTERS[i]),
        base + h / 2,
        C.violet,
        0.83,
        1
      ));
    });

    // This marks the sample mean, not the unknown population truth.
    parts.push(
      ln(
        meanX(ORIGINAL_MEAN),
        base,
        meanX(ORIGINAL_MEAN),
        base + height + 0.10,
        C.cyan,
        2
      ),

      txt(
        title || (
          simulated
            ? '10,000 cluster bootstrap means'
            : 'Exact cluster bootstrap distribution'
        ),
        P ? 22 : 20,
        C.ink,
        [CX, base + height + 0.55, 0]
      ),

      txt(
        simulated
          ? 'Deterministic resampling demonstration'
          : '256 equally likely ordered resamples',
        P ? 16 : 14,
        C.muted,
        [CX, base - 0.99, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // COMPARE THE TWO RESAMPLING DISTRIBUTIONS
  //
  // Both panels have identical horizontal and vertical scales.
  // This is essential: the broadening must not be manufactured
  // by stretching one histogram independently.
  // ===============================================================

  function distributionComparison({
    highlight = 'both',
    showSpread = false,
    showRatio = false
  } = {}) {
    const parts = [];

    const topBase = P ? -0.78 : -0.17;
    const bottomBase = P ? -3.98 : -2.17;

    const hMax = P ? 1.66 : 1.08;

    const barW =
      (meanX(30.5) - meanX(30)) * 0.86;

    const rows = [
      {
        bins: SINGLE_BINS,
        y: topBase,
        label: 'Single-delivery bootstrap',
        color: C.cyan,
        se: SINGLE_BOOTSTRAP_SE,
        key: 'single'
      },

      {
        bins: CLUSTER_BINS,
        y: bottomBase,
        label: 'Whole-day cluster bootstrap',
        color: C.violet,
        se: CLUSTER_BOOTSTRAP_SE,
        key: 'cluster'
      }
    ];

    rows.forEach(item => {
      const {
        bins,
        y,
        label,
        color,
        se,
        key
      } = item;

      const active =
        highlight === 'both' ||
        highlight === key;

      const drawColor =
        active ? color : C.muted;

      parts.push(
        ln(
          LEFT,
          y,
          RIGHT,
          y,
          C.muted,
          2
        ),

        txt(
          label,
          P ? 21 : 19,
          drawColor,
          [CX, y + hMax + 0.38, 0]
        )
      );

      bins.forEach((probability, i) => {
        if (probability <= 0) return;

        const h =
          probability /
          COMMON_MAX *
          hMax;

        parts.push(rect(
          barW,
          Math.max(0.001, h),
          meanX(BIN_CENTERS[i]),
          y + h / 2,
          color,
          active ? 0.83 : 0.45,
          1
        ));
      });

      parts.push(
        ln(
          meanX(ORIGINAL_MEAN),
          y,
          meanX(ORIGINAL_MEAN),
          y + hMax + 0.08,
          C.violet,
          1.8
        )
      );

      [26, 28, 30, 32, 34].forEach(v => {
        parts.push(
          ln(
            meanX(v),
            y - 0.055,
            meanX(v),
            y + 0.055,
            C.muted,
            1.2
          ),

          txt(
            String(v),
            P ? 15 : 13,
            C.muted,
            [meanX(v), y - 0.22, 0],
            true
          )
        );
      });

      if (showSpread && active) {
        const bracketY =
          y + hMax * 0.38;

        parts.push(
          bracket(
            meanX(ORIGINAL_MEAN - se),
            meanX(ORIGINAL_MEAN + se),
            bracketY,
            C.ink,
            0.075
          ),

          txt(
            `${se.toFixed(2)} min`,
            P ? 18 : 16,
            drawColor,
            [
              meanX(34.55),
              y + hMax * 0.73,
              0
            ],
            true,
            1.37
          )
        );
      }
    });

    if (P) {
      parts.push(txt(
        'Same bins and probability scale',
        16,
        C.muted,
        [CX, -4.77, 0]
      ));
    }

    if (showRatio && P) {
      parts.push(txt(
        'Nearly twice the spread',
        21,
        C.green,
        [CX, -5.17, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // STANDARD ERROR COMPARISON
  //
  // The displayed 0.98 is the earlier checked simulation result.
  // The cluster result rounds to 1.84.
  //
  // Both bars have the same centre and minutes scale.
  // ===============================================================

  function spreadComparison({
    highlight = 'both',
    showRatio = false
  } = {}) {
    const parts = [];

    const upperY = P ? 0.35 : 0.43;
    const lowerY = P ? -1.65 : -1.08;

    const base = P ? -3.55 : -2.20;

    parts.push(axis(
      meanX,
      [24, 26, 28, 30, 32, 34, 36],
      base
    ));

    const rows = [
      {
        y: upperY,
        se: SINGLE_BOOTSTRAP_SE,
        label: 'Resample single deliveries',
        color: C.cyan,
        key: 'single'
      },

      {
        y: lowerY,
        se: CLUSTER_BOOTSTRAP_SE,
        label: 'Resample whole days',
        color: C.violet,
        key: 'cluster'
      }
    ];

    rows.forEach(({ y, se, label, color, key }) => {
      const active =
        highlight === 'both' ||
        highlight === key;

      const drawColor =
        active ? color : C.muted;

      parts.push(
        net(
          meanX,
          ORIGINAL_MEAN - se,
          ORIGINAL_MEAN + se,
          y,
          drawColor,
          0.15
        ),

        glowDot(
          meanX(ORIGINAL_MEAN),
          y,
          drawColor,
          0.09
        ),

        txt(
          label,
          P ? 21 : 19,
          drawColor,
          [CX, y + 0.58, 0]
        ),

        txt(
          `SE = ${se.toFixed(2)} min`,
          P ? 23 : 21,
          drawColor,
          [CX, y - 0.45, 0],
          true
        )
      );
    });

    if (showRatio) {
      parts.push(txt(
        '1.84 ÷ 0.98 ≈ 1.88',
        P ? 21 : 18,
        C.green,
        [CX, P ? -2.69 : -1.78, 0],
        true
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // PERCENTILE INTERVAL COMPARISON
  //
  // Individual bootstrap mean interval:
  // approximately 28.1 to 31.9 minutes.
  //
  // Cluster bootstrap mean interval:
  // approximately 26.6 to 33.4 minutes.
  //
  // All interval endpoints below use the fixed lesson values.
  // ===============================================================

  function intervalComparison({
    showSingle = true,
    showCluster = true,
    showWidths = false,
    showExtra = false,
    highlightCluster = false
  } = {}) {
    const parts = [];

    const upperY = P ? 0.42 : 0.49;
    const lowerY = P ? -1.69 : -1.05;

    const base = P ? -3.65 : -2.22;

    parts.push(axis(
      meanX,
      [24, 26, 28, 30, 32, 34, 36],
      base
    ));

    const singleColor =
      highlightCluster ? C.muted : C.cyan;

    if (showSingle) {
      parts.push(
        net(
          meanX,
          SINGLE_LO,
          SINGLE_HI,
          upperY,
          singleColor,
          0.16
        ),

        glowDot(
          meanX(ORIGINAL_MEAN),
          upperY,
          C.violet,
          0.095
        ),

        txt(
          'Single-delivery bootstrap',
          P ? 21 : 19,
          singleColor,
          [CX, upperY + 0.58, 0]
        ),

        txt(
          '28.1',
          P ? 21 : 19,
          singleColor,
          [meanX(SINGLE_LO), upperY - 0.39, 0],
          true
        ),

        txt(
          '31.9',
          P ? 21 : 19,
          singleColor,
          [meanX(SINGLE_HI), upperY - 0.39, 0],
          true
        )
      );
    }

    if (showCluster) {
      parts.push(
        net(
          meanX,
          CLUSTER_LO,
          CLUSTER_HI,
          lowerY,
          C.violet,
          0.18
        ),

        glowDot(
          meanX(ORIGINAL_MEAN),
          lowerY,
          C.violet,
          0.10
        ),

        txt(
          'Whole-day cluster bootstrap',
          P ? 21 : 19,
          C.violet,
          [CX, lowerY + 0.58, 0]
        ),

        txt(
          '26.6',
          P ? 22 : 20,
          C.violet,
          [meanX(CLUSTER_LO), lowerY - 0.39, 0],
          true
        ),

        txt(
          '33.4',
          P ? 22 : 20,
          C.violet,
          [meanX(CLUSTER_HI), lowerY - 0.39, 0],
          true
        )
      );
    }

    if (showWidths) {
      if (showSingle) {
        parts.push(txt(
          '3.8 min',
          P ? 17 : 15,
          singleColor,
          [CX, upperY - 0.38, 0],
          true
        ));
      }

      if (showCluster) {
        parts.push(txt(
          '6.8 min',
          P ? 17 : 15,
          C.violet,
          [CX, lowerY - 0.38, 0],
          true
        ));
      }
    }

    if (showExtra && showCluster && showSingle) {
      parts.push(
        ln(
          meanX(CLUSTER_LO),
          lowerY,
          meanX(SINGLE_LO),
          lowerY,
          GOLD,
          7
        ),

        ln(
          meanX(SINGLE_HI),
          lowerY,
          meanX(CLUSTER_HI),
          lowerY,
          GOLD,
          7
        ),

        new M.DashedLine({
          start: [
            meanX(SINGLE_LO),
            upperY - 0.18,
            0
          ],

          end: [
            meanX(SINGLE_LO),
            lowerY + 0.18,
            0
          ],

          color: C.muted
        }),

        new M.DashedLine({
          start: [
            meanX(SINGLE_HI),
            upperY - 0.18,
            0
          ],

          end: [
            meanX(SINGLE_HI),
            lowerY + 0.18,
            0
          ],

          color: C.muted
        })
      );
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // RUNS OF CALM OR BUSY DAYS
  //
  // Example sequences drawn from the actual four clusters.
  // These are illustrative possible cluster resamples.
  // ===============================================================

  function calmBusyRunsPicture() {
    const parts = [];

    const examples = [
      {
        days: [0, 0, 1, 0],
        label: 'A run of calmer days',
        color: DAY_COLORS[0]
      },

      {
        days: [3, 3, 2, 3],
        label: 'A run of busier days',
        color: DAY_COLORS[3]
      }
    ];

    const top = P ? 0.59 : 0.68;
    const pitch = P ? 2.25 : 1.48;

    examples.forEach((item, row) => {
      const y = top - row * pitch;

      parts.push(txt(
        item.label,
        P ? 22 : 20,
        item.color,
        [CX, y + 0.64, 0]
      ));

      item.days.forEach((d, i) => {
        const x =
          CX + (i - 1.5) * 1.12;

        const day = CLUSTERS[d];

        parts.push(
          outline(
            x,
            y,
            0.99,
            P ? 0.81 : 0.62,
            day.color,
            0.06
          ),

          txt(
            day.short,
            P ? 17 : 15,
            day.color,
            [x, y + 0.17, 0],
            true
          )
        );

        for (let j = 0; j < PER_DAY; j++) {
          parts.push(glowDot(
            x + (j - 1.5) * 0.16,
            y - 0.14,
            day.color,
            P ? 0.047 : 0.037
          ));
        }
      });

      const average = item.days.reduce(
        (sum, d) =>
          sum + CLUSTERS[d].mean,
        0
      ) / DAYS;

      parts.push(
        txt(
          `Mean ≈ ${average.toFixed(1)} min`,
          P ? 23 : 21,
          item.color,
          [CX, y - 0.67, 0],
          true
        )
      );
    });

    if (P) {
      parts.push(txt(
        'Whole days move together',
        20,
        C.green,
        [CX, -3.80, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // WHAT TO RESAMPLE
  //
  // Contrast separating individual values with keeping
  // the original sampled groups intact.
  // ===============================================================

  function correctUnitPicture() {
    const parts = [];

    const top = P ? 0.46 : 0.61;
    const lower = P ? -1.85 : -1.02;

    const groupDX = 1.42;

    const mixedGroups = [
      [0, 1, 2, 3],
      [2, 0, 3, 1],
      [1, 3, 0, 2],
      [3, 2, 1, 0]
    ];

    mixedGroups.forEach((colors, i) => {
      const x =
        CX + (i - 1.5) * groupDX;

      parts.push(outline(
        x,
        top,
        1.19,
        P ? 0.82 : 0.63,
        C.muted
      ));

      colors.forEach((d, j) => {
        parts.push(glowDot(
          x + (j - 1.5) * 0.21,
          top,
          DAY_COLORS[d],
          P ? 0.066 : 0.053
        ));
      });
    });

    parts.push(
      txt(
        'Break groups apart',
        P ? 22 : 20,
        MISS,
        [CX, top + 0.66, 0]
      ),

      txt(
        '×',
        P ? 30 : 26,
        MISS,
        [RIGHT - 0.23, top, 0],
        true
      )
    );

    DAY_DRAW.forEach((d, i) => {
      const x =
        CX + (i - 1.5) * groupDX;

      const color = DAY_COLORS[d];

      parts.push(outline(
        x,
        lower,
        1.19,
        P ? 0.82 : 0.63,
        color,
        0.06
      ));

      for (let j = 0; j < PER_DAY; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * 0.21,
          lower,
          color,
          P ? 0.066 : 0.053
        ));
      }
    });

    parts.push(
      txt(
        'Keep the sampled groups intact',
        P ? 22 : 20,
        C.green,
        [CX, lower + 0.70, 0]
      ),

      txt(
        '✓',
        P ? 29 : 25,
        C.green,
        [RIGHT - 0.23, lower, 0],
        true
      ),

      txt(
        'Resample the original sampling units',
        P ? 20 : 18,
        C.ink,
        [CX, lower - 0.87, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // GENERAL APPLICATIONS OF CLUSTER RESAMPLING
  // ===============================================================

  function groupIcon(
    x,
    y,
    color,
    kind = 'class'
  ) {
    const parts = [];

    const w = 0.85;
    const h = 0.62;

    parts.push(outline(
      x,
      y,
      w,
      h,
      color,
      0.055
    ));

    if (kind === 'class') {
      for (let j = 0; j < 4; j++) {
        parts.push(glowDot(
          x + (j % 2 - 0.5) * 0.27,
          y + (0.5 - Math.floor(j / 2)) * 0.22,
          color,
          0.055
        ));
      }
    }

    if (kind === 'hospital') {
      parts.push(
        rect(
          0.13,
          0.43,
          x,
          y,
          color,
          0.86,
          0
        ),

        rect(
          0.43,
          0.13,
          x,
          y,
          color,
          0.86,
          0
        )
      );
    }

    if (kind === 'shop') {
      parts.push(
        outline(
          x,
          y - 0.05,
          0.48,
          0.34,
          color,
          0.08
        ),

        ln(
          x - 0.30,
          y + 0.16,
          x + 0.30,
          y + 0.16,
          color,
          3
        ),

        ln(
          x,
          y - 0.22,
          x,
          y + 0.10,
          color,
          1.7
        )
      );
    }

    if (kind === 'day') {
      parts.push(
        outline(
          x,
          y,
          0.52,
          0.43,
          color,
          0.08
        ),

        ln(
          x - 0.26,
          y + 0.09,
          x + 0.26,
          y + 0.09,
          color,
          2
        )
      );

      for (let j = 0; j < 4; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * 0.105,
          y - 0.06,
          color,
          0.028
        ));
      }
    }

    return new M.VGroup(...parts);
  }

  function applicationsPicture(reveal = 4) {
    const items = [
      {
        unit: 'Pupils',
        group: 'Classes',
        kind: 'class',
        color: DAY_COLORS[0]
      },

      {
        unit: 'Patients',
        group: 'Hospitals',
        kind: 'hospital',
        color: DAY_COLORS[1]
      },

      {
        unit: 'Sales',
        group: 'Shops',
        kind: 'shop',
        color: DAY_COLORS[2]
      },

      {
        unit: 'Deliveries',
        group: 'Days',
        kind: 'day',
        color: DAY_COLORS[3]
      }
    ];

    const top = P ? 0.65 : 0.79;
    const pitch = P ? 1.03 : 0.72;

    const parts = [];

    items.slice(0, reveal)
      .forEach((item, i) => {
        const y = top - i * pitch;

        parts.push(
          outline(
            CX,
            y,
            W - 0.30,
            pitch * 0.82,
            item.color,
            0.035
          ),

          groupIcon(
            LEFT + 0.66,
            y,
            item.color,
            item.kind
          ),

          txt(
            item.unit,
            P ? 20 : 18,
            C.ink,
            [CX - W * 0.18, y, 0],
            false,
            W * 0.26
          ),

          arrow(
            CX - 0.10,
            y,
            CX + 0.44,
            y,
            C.muted,
            1.8
          ),

          txt(
            item.group,
            P ? 21 : 19,
            item.color,
            [CX + W * 0.28, y, 0],
            false,
            W * 0.34
          )
        );
      });

    parts.push(txt(
      'Observations inside sampled groups',
      P ? 22 : 20,
      C.ink,
      [CX, top + 0.63, 0]
    ));

    if (reveal === 4) {
      parts.push(txt(
        'Resample the groups when appropriate',
        P ? 20 : 18,
        C.green,
        [CX, top - 3 * pitch - 0.70, 0]
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // ONLY 256 POSSIBLE ORDERED CLUSTER RESAMPLES
  //
  // A four-position sequence has four choices at each position.
  // The 16-by-16 grid contains exactly 256 cells:
  //
  // Row:    first two day choices.
  // Column: last two day choices.
  //
  // Each cell stands for one ordered sequence of four days.
  // ===============================================================

  function combinationsGridPicture() {
    const parts = [];

    const cols = 16;
    const rows = 16;

    const dx = P ? 0.275 : 0.235;
    const dy = P ? 0.245 : 0.145;

    const top = P ? 0.65 : 0.77;

    const firstX =
      CX - (cols - 1) * dx / 2;

    for (let row = 0; row < rows; row++) {
      const a = Math.floor(row / 4);
      const b = row % 4;

      for (let col = 0; col < cols; col++) {
        const c = Math.floor(col / 4);
        const d = col % 4;

        const x = firstX + col * dx;
        const y = top - row * dy;

        const mean = (
          CLUSTERS[a].mean +
          CLUSTERS[b].mean +
          CLUSTERS[c].mean +
          CLUSTERS[d].mean
        ) / DAYS;

        const color = mean < 28
          ? DAY_COLORS[0]
          : mean > 32
            ? DAY_COLORS[3]
            : C.violet;

        parts.push(rect(
          dx * 0.72,
          dy * 0.72,
          x,
          y,
          color,
          0.78,
          0
        ));
      }
    }

    // Outline the 4x4 blocks of cells.
    // These outlines are placed from known coordinates.
    for (let blockRow = 0; blockRow < 4; blockRow++) {
      for (let blockCol = 0; blockCol < 4; blockCol++) {
        const x =
          firstX +
          (blockCol * 4 + 1.5) * dx;

        const y =
          top -
          (blockRow * 4 + 1.5) * dy;

        parts.push(outline(
          x,
          y,
          dx * 4,
          dy * 4,
          C.muted
        ));
      }
    }

    const bottom =
      top - (rows - 1) * dy;

    parts.push(
      txt(
        'Every possible ordered day resample',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.57, 0]
      ),

      txt(
        '16 × 16 = 256',
        P ? 27 : 24,
        GOLD,
        [CX, bottom - 0.49, 0],
        true
      ),

      txt(
        'One cell = one ordered resample',
        P ? 17 : 15,
        C.muted,
        [CX, bottom - 0.88, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  // Four choices for each of four draw positions.
  function fourChoicesPicture() {
    const parts = [];

    const dx = W / 4.15;
    const dy = P ? 0.62 : 0.45;

    const top = P ? 0.47 : 0.62;

    for (let draw = 0; draw < DAYS; draw++) {
      const x =
        CX + (draw - 1.5) * dx;

      parts.push(
        txt(
          `Draw ${draw + 1}`,
          P ? 18 : 16,
          C.ink,
          [x, top + 0.62, 0]
        ),

        outline(
          x,
          top - 1.5 * dy,
          dx * 0.87,
          dy * 4.0,
          C.muted
        )
      );

      for (let d = 0; d < DAYS; d++) {
        const day = CLUSTERS[d];

        parts.push(card(
          day.short,
          x,
          top - d * dy,
          day.color,
          dx * 0.72,
          dy * 0.76,
          P ? 17 : 15
        ));
      }

      parts.push(txt(
        '4 choices',
        P ? 17 : 15,
        C.ink,
        [x, top - 3 * dy - 0.62, 0],
        false,
        dx * 0.88
      ));
    }

    const bottom = top - 3 * dy;

    parts.push(
      txt(
        '4 × 4 × 4 × 4',
        P ? 28 : 25,
        C.ink,
        [CX, bottom - 1.14, 0],
        true
      ),

      txt(
        '= 256',
        P ? 32 : 28,
        GOLD,
        [CX, bottom - 1.62, 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // MORE REAL DAYS, NOT JUST MORE RESAMPLES
  //
  // Additional groups are schematic future observations.
  // No new measured delivery times are invented.
  // ===============================================================

  function moreDaysPicture() {
    const parts = [];

    const top = P ? 0.54 : 0.69;

    const dx = 1.39;

    for (let d = 0; d < DAYS; d++) {
      const x =
        CX + (d - 1.5) * dx;

      parts.push(
        outline(
          x,
          top,
          1.22,
          P ? 0.72 : 0.56,
          DAY_COLORS[d],
          0.06
        ),

        txt(
          CLUSTERS[d].short,
          P ? 17 : 15,
          DAY_COLORS[d],
          [x, top + 0.16, 0],
          true
        )
      );

      for (let j = 0; j < PER_DAY; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * 0.18,
          top - 0.13,
          DAY_COLORS[d],
          P ? 0.048 : 0.038
        ));
      }
    }

    parts.push(
      txt(
        'Current sample: only four days',
        P ? 22 : 20,
        GOLD,
        [CX, top + 0.67, 0]
      ),

      arrow(
        CX,
        top - 0.52,
        CX,
        P ? -1.08 : -0.39,
        C.green,
        2.5
      )
    );

    const lowerTop = P ? -1.48 : -0.78;
    const lowerPitch = P ? 0.67 : 0.48;

    // Twelve schematic future day slots.
    // The first four represent existing days.
    // The other eight are explicitly future collection targets.
    for (let i = 0; i < 12; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);

      const x =
        CX + (col - 1.5) * dx;

      const y =
        lowerTop - row * lowerPitch;

      const existing = i < 4;

      const color = existing
        ? DAY_COLORS[i]
        : C.green;

      parts.push(outline(
        x,
        y,
        1.22,
        lowerPitch * 0.80,
        color,
        existing ? 0.055 : 0.025
      ));

      if (existing) {
        for (let j = 0; j < PER_DAY; j++) {
          parts.push(glowDot(
            x + (j - 1.5) * 0.18,
            y,
            color,
            P ? 0.050 : 0.038
          ));
        }
      } else {
        parts.push(txt(
          '+ day',
          P ? 16 : 14,
          C.green,
          [x, y, 0],
          true
        ));
      }
    }

    parts.push(
      txt(
        'Collect observations on more real days',
        P ? 21 : 19,
        C.green,
        [
          CX,
          lowerTop -
          2 * lowerPitch -
          0.63,
          0
        ]
      )
    );

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // CHAPTER SUMMARY
  // ===============================================================

  function chapterSummaryPicture() {
    const items = [
      {
        name: 'Confidence intervals',
        note: 'Estimate uncertainty',
        color: C.cyan
      },

      {
        name: 'Normal and t intervals',
        note: 'Choose the right cut-off',
        color: C.violet
      },

      {
        name: 'Proportion intervals',
        note: 'Respect the 0–100% limits',
        color: C.green
      },

      {
        name: 'Bootstrap intervals',
        note: 'Resample and read the pile',
        color: C.cyan
      },

      {
        name: 'Cluster bootstrap',
        note: 'Keep groups together',
        color: C.violet
      }
    ];

    const top = P ? 0.80 : 0.96;
    const pitch = P ? 0.88 : 0.59;

    const parts = [];

    items.forEach(({ name, note, color }, i) => {
      const y = top - i * pitch;

      parts.push(
        outline(
          CX,
          y,
          W - 0.24,
          pitch * 0.80,
          color,
          0.035
        ),

        txt(
          '✓',
          P ? 20 : 17,
          color,
          [LEFT + 0.34, y, 0],
          true
        ),

        txt(
          name,
          P ? 19 : 17,
          color,
          [CX - W * 0.19, y, 0],
          false,
          W * 0.42
        ),

        txt(
          note,
          P ? 17 : 15,
          C.ink,
          [CX + W * 0.27, y, 0],
          false,
          W * 0.42
        )
      );
    });

    if (P) {
      parts.push(txt(
        'CHAPTER 6.2 COMPLETE',
        23,
        C.green,
        [CX, top - 4 * pitch - 0.77, 0],
        true
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // FINAL CLUSTER BOOTSTRAP WORKFLOW
  //
  // Whole groups -> resampled groups -> resampled means -> net.
  // The final net uses the actual checked lesson endpoints.
  // ===============================================================

  function finalWorkflowPicture() {
    const parts = [];

    const top = P ? 0.66 : 0.72;
    const middle = P ? -1.08 : -0.42;

    const groupDX = 1.37;

    for (let d = 0; d < DAYS; d++) {
      const x =
        CX + (d - 1.5) * groupDX;

      const color = DAY_COLORS[d];

      parts.push(
        outline(
          x,
          top,
          1.18,
          P ? 0.72 : 0.52,
          color,
          0.055
        ),

        txt(
          CLUSTERS[d].short,
          P ? 15 : 13,
          color,
          [x, top + 0.15, 0],
          true
        )
      );

      for (let j = 0; j < PER_DAY; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * 0.18,
          top - 0.13,
          color,
          P ? 0.048 : 0.037
        ));
      }
    }

    parts.push(
      txt(
        'Original sampled groups',
        P ? 21 : 19,
        C.ink,
        [CX, top + 0.59, 0]
      ),

      arrow(
        CX,
        top - 0.42,
        CX,
        middle + 0.44,
        C.violet,
        2.2
      )
    );

    DAY_DRAW.forEach((d, i) => {
      const x =
        CX + (i - 1.5) * groupDX;

      const color = DAY_COLORS[d];

      parts.push(
        outline(
          x,
          middle,
          1.18,
          P ? 0.72 : 0.52,
          color,
          0.055
        ),

        txt(
          CLUSTERS[d].short,
          P ? 15 : 13,
          color,
          [x, middle + 0.15, 0],
          true
        )
      );

      for (let j = 0; j < PER_DAY; j++) {
        parts.push(glowDot(
          x + (j - 1.5) * 0.18,
          middle - 0.13,
          color,
          P ? 0.048 : 0.037
        ));
      }
    });

    const netY = P ? -3.10 : -1.73;
    const base = P ? -4.48 : -2.35;

    parts.push(
      txt(
        'Resample whole groups',
        P ? 20 : 18,
        C.violet,
        [CX, middle - 0.56, 0]
      ),

      arrow(
        CX,
        middle - 0.76,
        CX,
        netY + 0.28,
        C.green,
        2.1
      ),

      net(
        meanX,
        CLUSTER_LO,
        CLUSTER_HI,
        netY,
        C.green,
        0.17
      ),

      glowDot(
        meanX(ORIGINAL_MEAN),
        netY,
        C.violet,
        0.11
      ),

      txt(
        '26.6',
        P ? 22 : 19,
        C.green,
        [meanX(CLUSTER_LO), netY - 0.39, 0],
        true
      ),

      txt(
        '33.4',
        P ? 22 : 19,
        C.green,
        [meanX(CLUSTER_HI), netY - 0.39, 0],
        true
      ),

      (() => {
        // Beside the arrow, not under it.
        const t = txt(
          '95% percentile interval',
          P ? 19 : 17,
          C.green,
          [0, netY + 0.38, 0]
        );
        t.moveTo([CX + 0.16 + t.getWidth() / 2, netY + 0.38, 0]);
        return t;
      })()
    );

    if (P) {
      parts.push(axis(
        meanX,
        [24, 26, 28, 30, 32, 34, 36],
        base
      ));
    }

    return new M.VGroup(...parts);
  }

  // ===============================================================
  // NARRATION-SYNCHRONISED BEATS
  // ===============================================================

  // ---------------------------------------------------------------
  // 0: Here is a detail we have ignored so far.
  // ---------------------------------------------------------------

  const originalDots = deliveryPicture();

  await until(S(0));
  await play(
    ...picture(originalDots),
    ...say('ONE DETAIL WE HAVE IGNORED', GOLD),
    ...fbox([
      '16 delivery times',
      'Mean = 30 minutes',
      ['How were they collected?', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 1: The sixteen deliveries were not timed on sixteen
  // different days.
  // ---------------------------------------------------------------

  const sixteenNotDays = fourDaysPicture({
    showValues: false,
    colored: false
  });

  await until(S(1));
  await play(
    ...picture(sixteenNotDays),
    ...say('16 DELIVERIES DOES NOT MEAN 16 DAYS', GOLD),
    ...fbox([
      '16 observations',
      ['Not 16 separate days', GOLD],
      'The collection matters.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 2: Four deliveries per day, on four days.
  // ---------------------------------------------------------------

  const groupedFour = fourDaysPicture({
    showValues: false,
    colored: false,
    showMeans: false
  });

  await until(S(2));
  await play(
    ...picture(groupedFour),
    ...say('4 DELIVERIES A DAY · 4 DAYS'),
    ...fbox([
      '4 days',
      '4 deliveries per day',
      ['4 × 4 = 16', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 3: Colour the dots by day.
  // ---------------------------------------------------------------

  const colorGroups = fourDaysPicture({
    showValues: false,
    colored: true,
    showMeans: false
  });

  await until(S(3));
  await play(
    ...picture(colorGroups),
    ...say('ONE COLOUR FOR EACH DAY'),
    ...fbox([
      ['Monday', DAY_COLORS[0]],
      ['Tuesday', DAY_COLORS[1]],
      ['Wednesday', DAY_COLORS[2]],
      ['Thursday', DAY_COLORS[3]]
    ])
  );

  // ---------------------------------------------------------------
  // 4: Monday: 23, 25, 26, 26. Mean 25.
  // ---------------------------------------------------------------

  const monday = deliveryPicture({
    coloredThrough: 0,
    highlightDay: 0,
    title: 'Monday’s four deliveries'
  });

  await until(S(4));
  await play(
    ...picture(monday),
    ...say('MONDAY: MEAN = 25', DAY_COLORS[0]),
    ...fbox([
      ['23, 25, 26, 26', DAY_COLORS[0]],
      'Sum = 100',
      '100 ÷ 4',
      ['Mean = 25', DAY_COLORS[0]]
    ], DAY_COLORS[0])
  );

  // ---------------------------------------------------------------
  // 5: Tuesday: 27, 28, 29, 30. Mean 28.5.
  // ---------------------------------------------------------------

  const tuesday = deliveryPicture({
    coloredThrough: 1,
    highlightDay: 1,
    title: 'Tuesday’s four deliveries'
  });

  await until(S(5));
  await play(
    ...picture(tuesday),
    ...say('TUESDAY: MEAN = 28.5', DAY_COLORS[1]),
    ...fbox([
      ['27, 28, 29, 30', DAY_COLORS[1]],
      'Sum = 114',
      '114 ÷ 4',
      ['Mean = 28.5', DAY_COLORS[1]]
    ], DAY_COLORS[1])
  );

  // ---------------------------------------------------------------
  // 6: Wednesday: 30, 31, 32, 33. Mean 31.5.
  // ---------------------------------------------------------------

  const wednesday = deliveryPicture({
    coloredThrough: 2,
    highlightDay: 2,
    title: 'Wednesday’s four deliveries'
  });

  await until(S(6));
  await play(
    ...picture(wednesday),
    ...say('WEDNESDAY: MEAN = 31.5', DAY_COLORS[2]),
    ...fbox([
      ['30, 31, 32, 33', DAY_COLORS[2]],
      'Sum = 126',
      '126 ÷ 4',
      ['Mean = 31.5', DAY_COLORS[2]]
    ], DAY_COLORS[2])
  );

  // ---------------------------------------------------------------
  // 7: Thursday: 34, 34, 35, 37. Mean 35.
  // ---------------------------------------------------------------

  const thursday = deliveryPicture({
    coloredThrough: 3,
    highlightDay: 3,
    title: 'Thursday’s four deliveries'
  });

  await until(S(7));
  await play(
    ...picture(thursday),
    ...say('THURSDAY: MEAN = 35', DAY_COLORS[3]),
    ...fbox([
      ['34, 34, 35, 37', DAY_COLORS[3]],
      'Sum = 140',
      '140 ÷ 4',
      ['Mean = 35', DAY_COLORS[3]]
    ], DAY_COLORS[3])
  );

  // ---------------------------------------------------------------
  // 8: Deliveries on the same day sit together.
  //
  // Separate the four groups vertically while preserving
  // their positions on the common minutes scale.
  // ---------------------------------------------------------------

  const sameDayDots = deliveryPicture({
    coloredThrough: 3,
    grouped: true,
    showMeans: true,
    showClusters: true,
    title: 'Same-day deliveries sit together'
  });

  await until(S(8));
  await play(
    ...picture(sameDayDots),
    ...say('SAME-DAY DELIVERIES SIT TOGETHER'),
    ...fbox([
      ['Mon: 25', DAY_COLORS[0]],
      ['Tue: 28.5', DAY_COLORS[1]],
      ['Wed: 31.5', DAY_COLORS[2]],
      ['Thu: 35', DAY_COLORS[3]]
    ])
  );

  // ---------------------------------------------------------------
  // 9: Traffic explains why calm days tend to have faster
  // deliveries and busy days slower deliveries.
  // ---------------------------------------------------------------

  const traffic = trafficPicture();

  await until(S(9));
  await play(
    ...picture(traffic),
    ...say('TRAFFIC AFFECTS THE WHOLE DAY', GOLD),
    ...fbox([
      ['Calm day → faster', DAY_COLORS[0]],
      ['Busy day → slower', DAY_COLORS[3]],
      'Shared conditions'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 10: Values within the same group are dependent,
  // not independent draws.
  // ---------------------------------------------------------------

  const dependent = dependencePicture({
    showTitle: true,
    showLabels: false
  });

  await until(S(10));
  await play(
    ...picture(dependent),
    ...say('DEPENDENT = RELATED OBSERVATIONS', C.violet),
    ...fbox([
      ['Dependent observations', C.violet],
      'Values share conditions.',
      'Not independent draws.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 11: A group such as a day is called a cluster.
  // ---------------------------------------------------------------

  const namedClusters = dependencePicture({
    showTitle: true,
    showLabels: true
  });

  await until(S(11));
  await play(
    ...picture(namedClusters),
    ...say('CLUSTER = A GROUP OF RELATED VALUES', C.violet),
    ...fbox([
      ['Cluster', C.violet],
      'Here: one day',
      'Four related deliveries'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 12: The information is closer to four days than
  // sixteen fully independent observations.
  //
  // This is an intuition about the effective information,
  // not an assertion that the exact effective sample size is four.
  // ---------------------------------------------------------------

  const fourInformationGroups = dependencePicture({
    showTitle: false,
    showLabels: true,
    countGroups: true
  });

  await until(S(12));
  await play(
    ...picture(fourInformationGroups),
    ...say('16 VALUES · ONLY 4 SAMPLED DAYS', GOLD),
    ...fbox([
      '16 measured deliveries',
      '4 sampled day clusters',
      ['Less independent information', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 13: The previous bootstrap drew individual cards,
  // freely mixing deliveries across days.
  // ---------------------------------------------------------------

  const mixedCards = mixedDaysPicture({
    showWarning: false,
    showConnections: true
  });

  await until(S(13));
  await play(
    ...picture(mixedCards),
    ...say('THE OLD BOOTSTRAP MIXED DAYS FREELY'),
    ...fbox([
      'Draw individual cards.',
      'Different days get mixed.',
      ['Assumes independence', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 14: Individual resampling hides the day-to-day swing.
  // ---------------------------------------------------------------

  const hiddenSwing = daySwingPicture();

  await until(S(14));
  await play(
    ...picture(hiddenSwing),
    ...say('THAT HIDES THE DAY-TO-DAY SWING', GOLD),
    ...fbox([
      'Daily means:',
      '25 to 35 minutes',
      ['Between-day variation', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 15: Put each whole day into the hat as one card.
  // ---------------------------------------------------------------

  const wholeDayCards = dayCardsPicture({
    showMean: false,
    title: 'One card for an entire day'
  });

  await until(S(15));
  await play(
    ...picture(wholeDayCards),
    ...say('THE FIX: ONE CARD PER WHOLE DAY', C.green),
    ...fbox([
      'Do not split the day.',
      ['One card = one cluster', C.green],
      'All 4 values stay together.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 16: Four day cards: Monday, Tuesday,
  // Wednesday and Thursday.
  // ---------------------------------------------------------------

  const cardsInHat = dayHatPicture({
    drawn: 0,
    showReplacement: false
  });

  await until(S(16));
  await play(
    ...picture(cardsInHat),
    ...say('FOUR DAY CARDS IN THE HAT'),
    ...fbox([
      ['Monday', DAY_COLORS[0]],
      ['Tuesday', DAY_COLORS[1]],
      ['Wednesday', DAY_COLORS[2]],
      ['Thursday', DAY_COLORS[3]]
    ])
  );

  // ---------------------------------------------------------------
  // 17: Draw four day cards with replacement.
  // The source still contains all four days.
  // ---------------------------------------------------------------

  const replacementHat = dayHatPicture({
    drawn: 0,
    showReplacement: true
  });

  await until(S(17));
  await play(
    ...picture(replacementHat),
    ...say('DRAW FOUR DAYS WITH REPLACEMENT', C.green),
    ...fbox([
      'Draw one whole day.',
      'Record it and return it.',
      ['Repeat four times.', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 18: Example draw:
  // Tuesday, Thursday, Thursday, Monday.
  //
  // Animate fresh copies of entire day cards from the source
  // into the resampling tray.
  // The original day cards remain in the hat.
  // ---------------------------------------------------------------

  const movingDayCards = DAY_DRAW.map(
    dayIndex => drawCardAt(
      dayIndex,
      SOURCE_X,
      dayIndex
    )
  );

  const dayCardTargets = DAY_DRAW.map(
    (dayIndex, i) =>
      drawCardAt(
        dayIndex,
        TRAY_X,
        i
      )
  );

  await until(S(18));
  await play(
    ...say('TUESDAY · THURSDAY · THURSDAY · MONDAY', C.violet),
    ...fbox([
      ['Tuesday', DAY_COLORS[1]],
      ['Thursday', DAY_COLORS[3]],
      ['Thursday', DAY_COLORS[3]],
      ['Monday', DAY_COLORS[0]]
    ], C.violet),

    new M.LaggedStart(
      movingDayCards.map(o =>
        new M.FadeIn(o)
      ),
      {
        lagRatio: 0.08,
        runTime: 0.35
      }
    )
  );

  await play(
    new M.LaggedStart(
      movingDayCards.map((o, i) =>
        new M.Transform(
          o,
          dayCardTargets[i],
          {
            pathArc: i % 2 === 0
              ? 0.28
              : -0.28
          }
        )
      ),
      {
        lagRatio: 0.22,
        runTime: 2.0
      }
    )
  );

  // The tray counter now matches the four cards in the tray.
  {
    const oldCount = replacementHat.submobjects.find(
      m => typeof m.getText === 'function' && m.getText() === '0 drawn'
    );

    if (oldCount) {
      const newCount = txt('4 drawn', P ? 17 : 15, C.violet, oldCount.getCenter(), true);
      await play(new M.Transform(oldCount, newCount, { runTime: 0.4 }));
    }
  }

  // ---------------------------------------------------------------
  // 19: Each day card brings all four deliveries along.
  // Expand the drawn cards into their actual observed values.
  // ---------------------------------------------------------------

  const expandedCards = expandedResamplePicture({
    showValues: true,
    showCount: false
  });

  await until(S(19));
  await play(
    ...fadeAll(movingDayCards),
    ...picture(expandedCards),
    ...say('EVERY DAY BRINGS ALL FOUR DELIVERIES'),
    ...fbox([
      'Draw a day:',
      'Keep every value inside it.',
      ['Thursday appears twice.', DAY_COLORS[3]]
    ])
  );

  // ---------------------------------------------------------------
  // 20: There are still sixteen deliveries,
  // but the day groups remain intact.
  // ---------------------------------------------------------------

  const countedResample = expandedResamplePicture({
    showValues: true,
    showCount: true
  });

  await until(S(20));
  await play(
    ...picture(countedResample),
    ...say('STILL 16 DELIVERIES · GROUPS INTACT', C.green),
    ...fbox([
      '4 drawn day cards',
      '4 deliveries per card',
      ['4 × 4 = 16', C.green],
      'Dependence preserved'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 21: The fixed cluster resample mean is 30.875,
  // approximately 30.9 minutes.
  // ---------------------------------------------------------------

  const exampleMean = groupedResampleDots({
    showMean: true
  });

  await until(S(21));
  await play(
    ...picture(exampleMean),
    ...say('RESAMPLE MEAN ≈ 30.9 MINUTES', C.violet),
    ...fbox([
      '114 + 140 + 140 + 100',
      `= ${CLUSTER_RESAMPLE_SUM}`,
      '494 ÷ 16 = 30.875',
      ['≈ 30.9 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 22: Repeat ten thousand times,
  // calculating a mean for each resample.
  // ---------------------------------------------------------------

  const repeatedDays = repeatedDayDrawsPicture();

  await until(S(22));
  await play(
    ...picture(repeatedDays),
    ...say('REPEAT 10,000 TIMES', C.violet),
    ...fbox([
      'Draw 4 whole days.',
      'Calculate their mean.',
      ['Repeat 10,000 times.', C.violet],
      'Keep every mean.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 23: Name the cluster bootstrap.
  // Display the actual deterministic cluster simulation histogram.
  // ---------------------------------------------------------------

  const clusterPile = clusterHistogram({
    simulated: true
  });

  await until(S(23));
  await play(
    ...picture(clusterPile),
    ...say('THE CLUSTER BOOTSTRAP', C.violet),
    ...fbox([
      ['Cluster bootstrap', C.violet],
      'Resample whole groups,',
      'not separate values.'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 24: Compare the two piles of resampled means.
  //
  // Use exact resampling distributions for the comparison,
  // with the same bin width and probability scale.
  // ---------------------------------------------------------------

  const twoPiles = distributionComparison({
    highlight: 'both',
    showSpread: false
  });

  await until(S(24));
  await play(
    ...picture(twoPiles),
    ...say('COMPARE THE TWO BOOTSTRAP PILES'),
    ...fbox([
      ['Single deliveries', C.cyan],
      ['Whole days', C.violet],
      'Exact distributions',
      'Same plotting scale'
    ])
  );

  // ---------------------------------------------------------------
  // 25: Individual-delivery bootstrap spread ≈ 0.98 minutes.
  // This is the checked earlier simulation result.
  // ---------------------------------------------------------------

  const singleSpread = distributionComparison({
    highlight: 'single',
    showSpread: true
  });

  await until(S(25));
  await play(
    ...picture(singleSpread),
    ...say('SINGLE-DELIVERY SPREAD ≈ 0.98 MIN', C.cyan),
    ...fbox([
      'Earlier bootstrap:',
      'Draw single deliveries.',
      ['SE ≈ 0.98 minutes', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 26: Whole-day bootstrap spread ≈ 1.84 minutes.
  // Nearly twice the individual bootstrap spread.
  // ---------------------------------------------------------------

  const clusterSpread = distributionComparison({
    highlight: 'both',
    showSpread: true,
    showRatio: true
  });

  await until(S(26));
  await play(
    ...picture(clusterSpread),
    ...say('WHOLE-DAY SPREAD ≈ 1.84 MIN', C.violet),
    ...fbox([
      ['Single SE ≈ 0.98', C.cyan],
      ['Cluster SE ≈ 1.84', C.violet],
      '1.84 ÷ 0.98 ≈ 1.88',
      ['Nearly double', C.green]
    ], C.violet)
  );

  await until(S(26) + 2.4);

  const spreadBars = spreadComparison({
    highlight: 'both',
    showRatio: true
  });

  await play(
    ...picture(spreadBars)
  );

  // ---------------------------------------------------------------
  // 27: The confidence interval nets change as well.
  // Short beat: retain the spread picture.
  // ---------------------------------------------------------------

  await until(S(27));
  await play(
    ...say('THE NETS CHANGE TOO', C.green)
  );

  // ---------------------------------------------------------------
  // 28: Individual bootstrap percentile interval:
  // about 28.1 to 31.9 minutes.
  // ---------------------------------------------------------------

  const individualInterval = intervalComparison({
    showSingle: true,
    showCluster: false
  });

  await until(S(28));
  await play(
    ...picture(individualInterval),
    ...say('SINGLE DELIVERIES: 28.1 TO 31.9', C.cyan),
    ...fbox([
      '95% percentile interval',
      ['28.1 to 31.9 min', C.cyan],
      'Width ≈ 3.8 minutes'
    ])
  );

  // ---------------------------------------------------------------
  // 29: Whole-day cluster bootstrap percentile interval:
  // about 26.6 to 33.4 minutes.
  // ---------------------------------------------------------------

  const wholeDayInterval = intervalComparison({
    showSingle: true,
    showCluster: true,
    showWidths: true,
    showExtra: false
  });

  await until(S(29));
  await play(
    ...picture(wholeDayInterval),
    ...say('WHOLE DAYS: 26.6 TO 33.4', C.violet),
    ...fbox([
      '95% percentile intervals',
      ['Single: 28.1–31.9', C.cyan],
      ['Cluster: 26.6–33.4', C.violet],
      'Wider by 3.0 minutes'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 30: The wider net allows for runs of calm days
  // or runs of busy days.
  //
  // This better reflects dependence, although four clusters
  // are still insufficient for a trustworthy interval.
  // ---------------------------------------------------------------

  const honestWiderNet = intervalComparison({
    showSingle: true,
    showCluster: true,
    showWidths: true,
    showExtra: true
  });

  await until(S(30));
  await play(
    ...picture(honestWiderNet),
    ...say('THE WIDER NET ALLOWS FOR DAY-TO-DAY VARIATION', C.green),
    ...fbox([
      'Same estimated mean: 30',
      'Different uncertainty',
      ['Keep day-to-day variation.', C.green]
    ], C.green)
  );

  await until(S(30) + 2.6);

  const runs = calmBusyRunsPicture();

  await play(
    ...picture(runs),
    ...fbox([
      'Several calm days?',
      'Several busy days?',
      ['Both can happen.', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 31: Resample the groups that were sampled,
  // rather than the individual values inside them.
  // ---------------------------------------------------------------

  const correctUnit = correctUnitPicture();

  await until(S(31));
  await play(
    ...picture(correctUnit),
    ...say('RESAMPLE THE GROUPS THAT WERE SAMPLED', C.green),
    ...fbox([
      ['Resample the groups.', C.green],
      'Keep their values together.',
      ['Do not split clusters.', GOLD]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 32: What is cluster resampling for?
  // Data that come in sampled groups.
  // ---------------------------------------------------------------

  const generalGroups = dependencePicture({
    showTitle: false,
    showLabels: true,
    countGroups: false
  });

  await until(S(32));
  await play(
    ...picture(generalGroups),
    ...say('WHAT IS IT FOR? GROUPED DATA'),
    ...fbox([
      'Observations are related',
      'within sampled groups.',
      ['Use cluster resampling.', C.violet]
    ])
  );

  // ---------------------------------------------------------------
  // 33: Pupils in classes, patients in hospitals,
  // sales in shops, deliveries on days.
  // ---------------------------------------------------------------

  const applications = applicationsPicture(4);

  await until(S(33));
  await play(
    ...picture(applications),
    ...say('CLASSES · HOSPITALS · SHOPS · DAYS'),
    ...fbox([
      ['Pupils → classes', DAY_COLORS[0]],
      ['Patients → hospitals', DAY_COLORS[1]],
      ['Sales → shops', DAY_COLORS[2]],
      ['Deliveries → days', DAY_COLORS[3]]
    ])
  );

  // ---------------------------------------------------------------
  // 34: Common trap.
  // ---------------------------------------------------------------

  const trapPicture = new M.VGroup(
    txt(
      'A PRECISE-LOOKING NET?',
      P ? 29 : 26,
      GOLD,
      [CX, P ? 0.45 : 0.43, 0],
      true
    ),

    txt(
      'Did we ignore the groups?',
      P ? 23 : 21,
      C.ink,
      [CX, P ? -0.29 : -0.28, 0]
    ),

    net(
      meanX,
      SINGLE_LO,
      SINGLE_HI,
      P ? -1.55 : -1.31,
      C.cyan,
      0.17
    ),

    glowDot(
      meanX(ORIGINAL_MEAN),
      P ? -1.55 : -1.31,
      C.violet,
      0.11
    )
  );

  await until(S(34));
  await play(
    ...picture(trapPicture),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'A narrow interval',
      'is not always reliable.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 35: Ignoring clusters produces intervals that look precise
  // but underestimate uncertainty.
  // ---------------------------------------------------------------

  const misleadingPrecision = intervalComparison({
    showSingle: true,
    showCluster: true,
    showWidths: true,
    showExtra: true,
    highlightCluster: true
  });

  await until(S(35));
  await play(
    ...picture(misleadingPrecision),
    ...say('IGNORE CLUSTERS → NETS THAT ARE TOO NARROW', MISS),
    ...fbox([
      'Ignored dependence',
      'Underestimated uncertainty',
      ['False precision', MISS],
      'Account for the groups.'
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 36: With only four days there are just
  // 256 possible ordered day resamples.
  // ---------------------------------------------------------------

  const allCombinations = combinationsGridPicture();

  await until(S(36));
  await play(
    ...picture(allCombinations),
    ...say('ONLY 256 POSSIBLE ORDERED DAY RESAMPLES', GOLD),
    ...fbox([
      '4 original day cards',
      'Draw 4 with replacement',
      ['Only 256 sequences', GOLD],
      'Even with 10,000 draws'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 37: Four choices for each of four draws.
  // 4 × 4 × 4 × 4 = 256.
  // ---------------------------------------------------------------

  const fourChoices = fourChoicesPicture();

  await until(S(37));
  await play(
    ...picture(fourChoices),
    ...say('4 × 4 × 4 × 4 = 256', GOLD),
    ...fbox([
      '4 choices on draw 1',
      '4 choices on every draw',
      '4 × 4 × 4 × 4',
      ['= 256', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 38: Four clusters are too few for a trustworthy net.
  // Sami should time deliveries on many more days.
  // ---------------------------------------------------------------

  const collectMoreDays = moreDaysPicture();

  await until(S(38));
  await play(
    ...picture(collectMoreDays),
    ...say('FOUR CLUSTERS ARE TOO FEW', GOLD),
    ...fbox([
      'Only 4 sampled days.',
      'More bootstrap draws',
      'cannot create new days.',
      ['Collect more real days.', C.green]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 39: End of the chapter on intervals and resampling.
  // ---------------------------------------------------------------

  const chapterComplete = chapterSummaryPicture();

  await until(S(39));
  await play(
    ...picture(chapterComplete),
    ...say('CHAPTER 6.2 COMPLETE', C.green),
    ...fbox([
      ['Intervals and resampling', C.green],
      'Estimate uncertainty.',
      'Choose a suitable method.',
      'Respect the sampling design.'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 40: Final one-sentence summary.
  //
  // A cluster bootstrap resamples whole groups,
  // so the net preserves dependence within those groups.
  //
  // Keep the final workflow and the actual cluster interval
  // visible until the narration ends.
  // ---------------------------------------------------------------

  const finalWorkflow = finalWorkflowPicture();

  await until(S(40));
  await play(
    ...picture(finalWorkflow),
    ...say('CLUSTER BOOTSTRAP = RESAMPLE WHOLE GROUPS', C.green),
    ...fbox([
      ['Resample whole groups.', C.violet],
      'Keep their values together.',
      'Preserve dependence.',
      ['Interval ≈ 26.6–33.4', C.green]
    ], C.green)
  );
}
