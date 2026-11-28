// lesson 12.4.13
// Paired model comparison with the bootstrap.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// The three sample draws and all histogram checkpoints reproduce
// NumPy default_rng(42), using twelve indices per bootstrap trial.
// Exact histogram counts are embedded so no Python runtime is needed.
// Browser playback has not been verified here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ============================================================
  // FIXED CHAPTER DATA
  // ============================================================

  const ACTUAL = [12, 8, 14, 6, 16, 20, 18, 22, 24, 26, 28, 30];
  const TOOL_A = [18, 8, 14, 8, 15, 22, 17, 22, 25, 24, 28, 31];
  const TOOL_B = [14, 10, 12, 7, 14, 20, 20, 21, 24, 25, 28, 30];

  const PROBABILITIES = [
    90, 60, 60, 30, 30, 30,
    10, 10, 10, 10, 10, 10
  ];

  const DATA = ACTUAL.map((actual, i) => {
    const a = TOOL_A[i];
    const b = TOOL_B[i];

    const errorA = Math.abs(a - actual);
    const errorB = Math.abs(b - actual);

    return {
      id: `P${i + 1}`,
      index: i,
      actual,
      a,
      b,
      prob: PROBABILITIES[i],
      failed: actual <= 10,
      errorA,
      errorB,
      difference: errorA - errorB
    };
  });

  const N = DATA.length;

  const DIFFERENCES = DATA.map(d => d.difference);

  const TOTAL_A = DATA.reduce((s, d) => s + d.errorA, 0);
  const TOTAL_B = DATA.reduce((s, d) => s + d.errorB, 0);

  const TOTAL_DIFFERENCE = DIFFERENCES.reduce((s, d) => s + d, 0);
  const OBSERVED_MEAN = TOTAL_DIFFERENCE / N;

  const MAE_A = TOTAL_A / N;
  const MAE_B = TOTAL_B / N;

  const OBSERVED_MINUTES = OBSERVED_MEAN * 60;

  // Checked facts:
  //
  // Tool A errors:
  // 6, 0, 0, 2, 1, 2, 1, 0, 1, 2, 0, 1.
  //
  // Tool B errors:
  // 2, 2, 2, 1, 2, 0, 2, 1, 0, 1, 0, 0.
  //
  // Paired differences, A minus B:
  // 4, -2, -2, 1, -1, 2, -1, -1, 1, 1, 0, 1.
  //
  // Total A = 16 hours.
  // Total B = 13 hours.
  //
  // Sum of paired differences = 3 hours.
  // Mean paired difference = 3/12 = 0.25 hours.
  //
  // Positive difference: Tool B has the smaller error.
  // Negative difference: Tool A has the smaller error.
  // Zero difference: equal absolute errors on that case.
  //
  // Observed advantage for Tool B = 15 minutes per pump.

  const signed = (v, digits = null) => {
    const value = digits === null
      ? String(Math.abs(v))
      : Math.abs(v).toFixed(digits);

    return v < 0
      ? `−${value}`
      : v > 0
        ? `+${value}`
        : digits === null
          ? '0'
          : (0).toFixed(digits);
  };

  const fmt = (v, digits = 2) =>
    Number(v).toFixed(digits).replace('-', '−');

  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const VIOLET = C.violet || '#A78BFA';
  const GREEN = C.green || '#4ADE80';
  const AMBER = C.amber || '#FBBF24';
  const RED = C.red || '#F87171';

  function differenceColor(value) {
    return value > 0
      ? VIOLET
      : value < 0
        ? BLUE
        : WHITE;
  }

  // ============================================================
  // EXACT BOOTSTRAP DEMONSTRATION
  // ============================================================

  // These are zero-based pump indices, reproduced using:
  //
  // rng = np.random.default_rng(42)
  // draws = rng.integers(0, 12, size=(10000, 12))
  //
  // Each row samples whole pumps with replacement.
  // Both tools' predictions always remain paired.

  const TRIALS = [
    [1, 9, 7, 5, 5, 10, 1, 8, 2, 1, 6, 11],
    [8, 9, 8, 9, 6, 1, 10, 5, 6, 4, 2, 11],
    [9, 7, 4, 9, 6, 5, 5, 2, 1, 6, 10, 0]
  ].map((indices, i) => {
    const differences = indices.map(j => DATA[j].difference);
    const sum = differences.reduce((s, d) => s + d, 0);

    return {
      number: i + 1,
      indices,
      differences,
      sum,
      mean: sum / N
    };
  });

  // Trial 1: sum = -3, mean = -0.25.
  // Trial 2: sum = 0, mean = 0.
  // Trial 3: sum = 2, mean = 0.166666...

  // Histogram checkpoint counts generated directly from the
  // same NumPy sequence.
  //
  // Each array has 49 entries.
  // Entry i counts bootstrap samples whose SUM is i - 17.
  // The corresponding sample MEAN is (i - 17) / 12 hours.
  //
  // These are exact simulated frequencies, not approximations
  // to a normal distribution.
  //
  // The 30-, 100-, 1000- and 10000-trial checkpoints are nested:
  // every checkpoint includes all trials from earlier checkpoints.

  const MIN_SUM = -17;

  const HISTOGRAMS = {
    30: [
      0,0,0,0,0,0,0,0,0,0,
      1,0,0,2,2,1,0,2,2,7,
      0,3,1,1,3,1,0,1,0,1,
      0,1,0,0,1,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0
    ],

    100: [
      0,0,0,0,0,0,0,0,0,0,
      3,1,2,3,5,6,4,10,4,13,
      9,11,3,5,9,1,1,2,0,1,
      1,2,0,3,1,0,0,0,0,0,
      0,0,0,0,0,0,0,0,0
    ],

    1000: [
      0,0,0,1,2,3,4,4,3,12,
      27,17,34,33,49,53,57,67,75,65,
      63,61,49,56,59,41,28,28,29,20,
      17,11,8,5,5,2,4,2,2,2,
      1,0,0,1,0,0,0,0,0
    ],

    10000: [
      1,2,0,7,11,20,43,47,76,113,
      135,194,273,356,450,478,574,632,668,694,
      689,667,595,608,500,457,366,312,288,210,
      151,104,93,60,39,32,19,13,12,5,
      3,1,0,1,0,0,0,0,1
    ]
  };

  // Reconstruct the sorted simulated means from exact
  // histogram counts. Their original order is not needed
  // when calculating percentile intervals.

  function sortedMeans(counts) {
    return counts.flatMap((count, i) =>
      Array.from(
        { length: count },
        () => (MIN_SUM + i) / N
      )
    );
  }

  // Matches NumPy's default linear percentile interpolation.

  function quantile(sorted, q) {
    const position = (sorted.length - 1) * q;
    const lo = Math.floor(position);
    const hi = Math.ceil(position);
    const fraction = position - lo;

    return sorted[lo] +
      fraction * (sorted[hi] - sorted[lo]);
  }

  function bootstrapInterval(count) {
    const sorted = sortedMeans(HISTOGRAMS[count]);

    return {
      lower: quantile(sorted, 0.025),
      upper: quantile(sorted, 0.975)
    };
  }

  const CI100 = bootstrapInterval(100);
  const CI1000 = bootstrapInterval(1000);
  const CI10000 = bootstrapInterval(10000);

  // 100 trials:
  // [-0.54375, 1.3333333333333333]
  //
  // 1000 trials:
  // [-0.6666666666666666, 1.25]
  //
  // 10000 trials:
  // [-0.6666666666666666, 1.25]

  // ============================================================
  // RESPONSIVE LAYOUT
  // ============================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.30, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ============================================================
  // DRAWING HELPERS
  // ============================================================

  function text(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(s, size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted, sw = 1.5) {
    const length = Math.hypot(x2 - x1, y2 - y1);

    const count = Math.max(1, Math.ceil(length / 0.15));

    return new M.VGroup(
      ...Array.from({ length: count }, (_, i) => {
        const a = i / count;
        const b = (i + 0.56) / count;

        return line(
          x1 + a * (x2 - x1),
          y1 + a * (y2 - y1),
          x1 + b * (x2 - x1),
          y1 + b * (y2 - y1),
          color,
          sw
        );
      })
    );
  }

  function rect(x, y, w, h, color, opacity = 0.2, sw = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function rounded(
    x, y, w, h,
    color = C.muted,
    fill = C.card,
    opacity = 0.95,
    sw = 2,
    radius = 0.12
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: sw
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(x, y, radius, color, opacity = 1, sw = 2) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function arrow(x1, y1, x2, y2, color, head = 0.13) {
    const angle = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.4),

      line(
        x2, y2,
        x2 + head * Math.cos(angle + Math.PI * 0.82),
        y2 + head * Math.sin(angle + Math.PI * 0.82),
        color, 2.4
      ),

      line(
        x2, y2,
        x2 + head * Math.cos(angle - Math.PI * 0.82),
        y2 + head * Math.sin(angle - Math.PI * 0.82),
        color, 2.4
      )
    );
  }

  function group(...objects) {
    return new M.VGroup(...objects.filter(Boolean));
  }

  const fadeIn = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  const indicate = (objects, color = AMBER, runTime = 0.8) =>
    objects.filter(Boolean).map(o =>
      new M.Indicate(o, { color, runTime })
    );

  function lag(anims, runTime = 1.2, lagRatio = 0.12) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
    });
  }

  // Named slots store independently displayed objects.
  // No already-visible objects are wrapped in new VGroups.

  const slots = new Map();

  function replace(key, objects = []) {
    const old = slots.get(key) || [];

    slots.set(key, objects);

    return [
      ...fadeOut(old),
      ...fadeIn(objects)
    ];
  }

  function clear(...keys) {
    return keys.flatMap(key => replace(key, []));
  }

  function get(key) {
    return slots.get(key) || [];
  }

  // ============================================================
  // APPROVED FORMULA BOX
  // ============================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

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
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = group(r, ...texts);

    const scale = Math.min(
      1,
      (P ? FW - 1.2 : 4.0) / wd,
      (P ? 1.35 : 2.45) / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const anims = boxNow
      ? [new M.FadeOut(boxNow), new M.FadeIn(g)]
      : [new M.FadeIn(g)];

    boxNow = g;

    return anims;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // SHARED CHAPTER ICONS
  // ============================================================

  function pumpIcon(x, y, s = 1, color = C.cyan) {
    const motor = rounded(
      x - 0.29 * s, y,
      0.60 * s, 0.40 * s,
      color, color, 0.14, 2, 0.07 * s
    );

    const fins = [-0.47, -0.35, -0.23].map(dx =>
      line(
        x + dx * s, y - 0.13 * s,
        x + dx * s, y + 0.13 * s,
        color, 1.3
      )
    );

    const housing = circle(
      x + 0.19 * s, y,
      0.27 * s, color, 0.12
    );

    const inlet = rect(
      x + 0.51 * s, y,
      0.20 * s, 0.15 * s,
      color, 0.15, 1.5
    );

    const outlet = rect(
      x + 0.19 * s, y + 0.36 * s,
      0.17 * s, 0.26 * s,
      color, 0.15, 1.5
    );

    const hub = circle(
      x + 0.19 * s, y,
      0.06 * s, color, 1, 1
    );

    const feet = [-0.29, 0.19].map(dx =>
      rect(
        x + dx * s, y - 0.26 * s,
        0.22 * s, 0.10 * s,
        color, 0.35, 1
      )
    );

    return group(
      motor,
      ...fins,
      housing,
      inlet,
      outlet,
      hub,
      ...feet
    );
  }

  function failureIcon(x, y, s = 1) {
    const d = new M.Rectangle({
      width: 0.17 * s,
      height: 0.17 * s,
      color: RED,
      strokeWidth: 1.5
    });

    d.setFill(RED, 1);
    d.rotate(Math.PI / 4);
    d.moveTo([x, y, 0]);

    return d;
  }

  function safeIcon(x, y, s = 1) {
    return circle(x, y, 0.11 * s, GREEN, 0, 2.4);
  }

  // ============================================================
  // PAIRED PUMP CARDS
  //
  // White: actual remaining hours.
  // Blue: Tool A prediction and error.
  // Purple: Tool B prediction and error.
  //
  // Each card contains both tools' information for one pump.
  // A bootstrap sample copies the whole card, never the two
  // tools' errors independently.
  // ============================================================

  const CARD_W = 1.49;
  const CARD_H = 1.42;

  function cardFrame(d, x, y, s = 1) {
    return group(
      rounded(
        x, y,
        CARD_W * s,
        CARD_H * s,
        C.muted,
        C.card,
        0.96,
        1.6,
        0.10 * s
      ),

      text(
        d.id,
        Math.max(12, Math.round(18 * s)),
        WHITE,
        x - 0.43 * s,
        y + 0.48 * s,
        true,
        0.52 * s
      ),

      pumpIcon(
        x + 0.20 * s,
        y + 0.43 * s,
        0.36 * s
      ),

      line(
        x - 0.63 * s,
        y + 0.20 * s,
        x + 0.63 * s,
        y + 0.20 * s,
        C.muted,
        1
      )
    );
  }

  function cardValues(d, x, y, s = 1) {
    return group(
      text(
        `Actual ${d.actual}`,
        Math.max(12, Math.round(17 * s)),
        WHITE,
        x,
        y + 0.045 * s,
        true,
        1.28 * s
      ),

      text(
        `A ${d.a}`,
        Math.max(12, Math.round(17 * s)),
        BLUE,
        x - 0.34 * s,
        y - 0.21 * s,
        true,
        0.64 * s
      ),

      text(
        `B ${d.b}`,
        Math.max(12, Math.round(17 * s)),
        VIOLET,
        x + 0.34 * s,
        y - 0.21 * s,
        true,
        0.64 * s
      ),

      text(
        'hours',
        Math.max(10, Math.round(12 * s)),
        C.muted,
        x,
        y - 0.49 * s,
        false
      )
    );
  }

  function cardErrorValues(d, x, y, s = 1) {
    return group(
      text(
        `A error ${d.errorA}`,
        Math.max(11, Math.round(14 * s)),
        BLUE,
        x,
        y + 0.045 * s,
        true,
        1.30 * s
      ),

      text(
        `B error ${d.errorB}`,
        Math.max(11, Math.round(14 * s)),
        VIOLET,
        x,
        y - 0.21 * s,
        true,
        1.30 * s
      )
    );
  }

  function cardDifference(d, x, y, s = 1) {
    const color = differenceColor(d.difference);

    return group(
      rounded(
        x,
        y - 0.49 * s,
        1.22 * s,
        0.31 * s,
        color,
        color,
        0.11,
        1.5,
        0.06 * s
      ),

      text(
        `${signed(d.difference)} h`,
        Math.max(12, Math.round(17 * s)),
        color,
        x,
        y - 0.49 * s,
        true,
        1.08 * s
      )
    );
  }

  function completeDifferenceCard(d, x, y, s = 1) {
    return group(
      cardFrame(d, x, y, s),
      cardErrorValues(d, x, y, s),
      cardDifference(d, x, y, s)
    );
  }

  // ============================================================
  // 0–2: A SMALL OBSERVED ADVANTAGE
  // ============================================================

  const introY = P ? 0.75 : 0.62;

  const introPump = pumpIcon(CX, introY, 1.40);

  const introArrowA = arrow(
    CX - 0.39, introY - 0.45,
    CX - 1.55, introY - 1.04,
    BLUE
  );

  const introArrowB = arrow(
    CX + 0.39, introY - 0.45,
    CX + 1.55, introY - 1.04,
    VIOLET
  );

  function toolPanel(x, y, name, color) {
    return group(
      rounded(
        x, y, 2.53, 1.04,
        color, C.card, 0.95, 2, 0.12
      ),

      text(
        name, 23, color,
        x, y + 0.15,
        true, 2.28
      ),

      text(
        'Hours remaining',
        16, WHITE,
        x, y - 0.22,
        false, 2.28
      )
    );
  }

  const introToolA = toolPanel(
    CX - 1.62, introY - 1.70, 'TOOL A', BLUE
  );

  const introToolB = toolPanel(
    CX + 1.62, introY - 1.70, 'TOOL B', VIOLET
  );

  const introQuestion = text(
    'A real advantage, or chance variation?',
    21, AMBER,
    CX,
    P ? -3.22 : -2.60,
    false, 6.5
  );

  await until(S(0));
  await play(
    ...replace('intro', [
      introPump,
      introArrowA,
      introArrowB,
      introToolA,
      introToolB
    ]),
    ...say('TWO TOOLS PREDICT HOURS REMAINING')
  );

  // Illustrative comparison, without introducing invented
  // measurements. The exact observed MAEs are calculated later.

  const smallAdvantage = text(
    'One tool makes slightly smaller mistakes',
    19, VIOLET,
    CX,
    P ? -2.05 : -2.02,
    false, 6.5
  );

  await until(S(1));
  await play(
    ...replace('intro-advantage', [smallAdvantage]),
    ...say('A SMALL DIFFERENCE IN PREDICTION QUALITY', VIOLET)
  );

  await until(S(2));
  await play(
    ...replace('intro-question', [introQuestion]),
    ...fbox([
      ['observed difference', VIOLET],
      'genuine overall advantage?',
      ['or chance variation?', AMBER]
    ], AMBER),
    ...say('IS ONE TOOL REALLY BETTER?', AMBER)
  );

  // ============================================================
  // 3–5: RETURN TO THE TWELVE EVALUATION PUMPS
  // ============================================================

  const GRID_DX = 1.65;
  const GRID_DY = P ? 1.62 : 1.29;
  const GRID_TOP = P ? 1.13 : 0.95;
  const GRID_SCALE = P ? 0.99 : 0.86;

  function gridPosition(i) {
    return [
      CX + (i % 4 - 1.5) * GRID_DX,
      GRID_TOP - Math.floor(i / 4) * GRID_DY,
      0
    ];
  }

  function gridBase(d) {
    const [x, y] = gridPosition(d.index);

    return cardFrame(d, x, y, GRID_SCALE);
  }

  function gridValues(d) {
    const [x, y] = gridPosition(d.index);

    return cardValues(d, x, y, GRID_SCALE);
  }

  function gridErrors(d) {
    const [x, y] = gridPosition(d.index);

    return cardErrorValues(d, x, y, GRID_SCALE);
  }

  function gridDifference(d) {
    const [x, y] = gridPosition(d.index);

    return cardDifference(d, x, y, GRID_SCALE);
  }

  const initialCards = DATA.map(gridBase);
  const initialValues = DATA.map(gridValues);

  const evaluationNote = text(
    'Not used to train either tool',
    17, GREEN,
    CX,
    P ? -3.14 : -2.53,
    false, 6.55
  );

  await until(S(3));
  await play(
    ...clear(
      'intro',
      'intro-advantage',
      'intro-question'
    ),
    ...clearBox(),
    lag(fadeIn(initialCards), 1.25, 0.08),
    ...say('THE SAME TWELVE WATER PUMPS')
  );

  await until(S(4));
  await play(
    lag(fadeIn(initialValues), 1.70, 0.08),
    ...fbox([
      ['white: actual hours', WHITE],
      ['blue: Tool A prediction', BLUE],
      ['purple: Tool B prediction', VIOLET]
    ]),
    ...say('ACTUAL HOURS AND BOTH TOOLS’ PREDICTIONS')
  );

  await until(S(5));
  await play(
    new M.FadeIn(evaluationNote),
    ...fbox([
      ['independent evaluation data', GREEN],
      'neither tool was trained',
      'using these twelve pumps'
    ], GREEN),
    ...say('THESE PUMPS WERE NOT USED FOR TRAINING', GREEN)
  );

  // ============================================================
  // ABSOLUTE ERROR NUMBER-LINE DEMONSTRATION
  //
  // Both tools use the same hour scale.
  // The white marker is the recorded outcome.
  // Horizontal error bars have lengths proportional to
  // absolute prediction errors.
  // ============================================================

  const EX_X0 = CX - 2.44;
  const EX_X1 = CX + 2.80;

  const EX_MIN = 4;
  const EX_MAX = 20;

  const exX = h =>
    EX_X0 + (h - EX_MIN) / (EX_MAX - EX_MIN) *
    (EX_X1 - EX_X0);

  const EX_AXIS_Y = P ? -2.48 : -2.10;

  const ERROR_ROW_A = P ? 0.33 : 0.49;
  const ERROR_ROW_B = P ? -1.05 : -0.76;

  function exampleAxes() {
    return group(
      line(
        EX_X0, EX_AXIS_Y,
        EX_X1, EX_AXIS_Y,
        C.muted, 2.8
      ),

      ...[4, 6, 8, 10, 12, 14, 16, 18, 20].flatMap(v => [
        line(
          exX(v), EX_AXIS_Y - 0.055,
          exX(v), EX_AXIS_Y + 0.055,
          C.muted, 1.4
        ),

        text(
          String(v),
          13, WHITE,
          exX(v), EX_AXIS_Y - 0.22,
          true, 0.49
        )
      ]),

      text(
        'Hours remaining',
        15, WHITE,
        (EX_X0 + EX_X1) / 2,
        EX_AXIS_Y - 0.49,
        false
      )
    );
  }

  function exampleHeader(d) {
    return group(
      pumpIcon(
        CX - 1.34,
        P ? 1.17 : 1.25,
        0.64
      ),

      text(
        d.id,
        23, WHITE,
        CX - 0.45,
        P ? 1.17 : 1.25,
        true
      ),

      text(
        `Actual: ${d.actual} h`,
        20, WHITE,
        CX + 1.31,
        P ? 1.17 : 1.25,
        true, 2.55
      )
    );
  }

  function actualGuide(d) {
    const x = exX(d.actual);

    return group(
      dashed(
        x, EX_AXIS_Y,
        x, ERROR_ROW_A + 0.35,
        WHITE, 1.8
      ),

      circle(
        x,
        EX_AXIS_Y,
        0.065,
        WHITE,
        1,
        1.5
      )
    );
  }

  function errorRow(d, tool) {
    const isA = tool === 'A';

    const predicted = isA ? d.a : d.b;
    const error = isA ? d.errorA : d.errorB;
    const color = isA ? BLUE : VIOLET;
    const y = isA ? ERROR_ROW_A : ERROR_ROW_B;

    const actualX = exX(d.actual);
    const predictedX = exX(predicted);

    const left = Math.min(actualX, predictedX);
    const right = Math.max(actualX, predictedX);

    const objects = [
      text(
        `Tool ${tool}`,
        17, color,
        CX - 3.02,
        y,
        true, 1.05
      ),

      line(
        EX_X0, y,
        EX_X1, y,
        C.muted, 0.7
      ),

      circle(
        actualX, y,
        0.070, WHITE,
        1, 1.5
      ),

      circle(
        predictedX, y,
        0.083, color,
        1, 1.6
      ),

      text(
        `Predicted ${predicted}`,
        16, color,
        Math.max(predictedX, actualX) + 0.9,
        y + 0.35,
        true, 1.64
      )
    ];

    if (error === 0) {
      objects.push(
        circle(
          actualX, y,
          0.15, color,
          0, 2.3
        )
      );
    } else {
      objects.push(
        rect(
          (left + right) / 2,
          y,
          right - left,
          0.17,
          color,
          0.68,
          1.8
        )
      );
    }

    objects.push(
      text(
        `Error = ${error} h`,
        19, color,
        error === 0 ? actualX : right + 0.95,
        y - 0.38,
        true, 2.25
      )
    );

    return group(...objects);
  }

  function differenceBadge(d) {
    const color = differenceColor(d.difference);

    const tag = pill(
      `A − B = ${signed(d.difference)} h`,
      color,
      19
    );

    tag.moveTo([
      P ? CX : 4.3,
      P ? -3.65 : -1.85,
      0
    ]);

    return tag;
  }

  // ============================================================
  // 6: RECALL ABSOLUTE ERROR
  // ============================================================

  const absoluteErrorPicture = group(
    line(
      CX - 2.38, -0.48,
      CX + 2.38, -0.48,
      C.muted, 2.8
    ),

    circle(
      CX - 1.00, -0.48,
      0.11, WHITE, 1, 1.6
    ),

    circle(
      CX + 1.25, -0.48,
      0.11, BLUE, 1, 1.6
    ),

    rect(
      CX + 0.125, -0.48,
      2.25, 0.19,
      BLUE, 0.65, 1.8
    ),

    text(
      'Actual',
      19, WHITE,
      CX - 1.00, -0.05
    ),

    text(
      'Prediction',
      19, BLUE,
      CX + 1.25, -0.05
    ),

    text(
      'Absolute error',
      21, C.cyan,
      CX + 0.125, -1.15
    ),

    arrow(
      CX - 0.93, -0.94,
      CX + 1.18, -0.94,
      C.cyan
    )
  );

  await until(S(6));
  await play(
    ...fadeOut([
      ...initialCards,
      ...initialValues,
      evaluationNote
    ]),
    ...replace('absolute-error', [absoluteErrorPicture]),
    ...fbox([
      ['absolute error', C.cyan],
      'distance between prediction',
      'and actual answer'
    ]),
    ...say('ABSOLUTE ERROR IS A DISTANCE')
  );

  // ============================================================
  // 7–11: PUMP ONE
  //
  // Actual = 12.
  // A predicts 18, error = 6.
  // B predicts 14, error = 2.
  // Difference = 6 - 2 = +4.
  // ============================================================

  const P1 = DATA[0];

  await until(S(7));
  await play(
    ...clear('absolute-error'),
    ...replace('example-axis', [exampleAxes()]),
    ...replace('example-header', [exampleHeader(P1)]),
    ...replace('actual-guide', [actualGuide(P1)]),
    ...fbox([
      ['P1 actual hours = 12', WHITE]
    ]),
    ...say('PUMP ONE ACTUALLY LASTED TWELVE HOURS')
  );

  await until(S(8));
  await play(
    ...replace('error-a', [errorRow(P1, 'A')]),
    ...fbox([
      ['Tool A predicts 18 h', BLUE],
      '|18 − 12|',
      ['error = 6 h', BLUE]
    ], BLUE),
    ...say('TOOL A: SIX HOURS OF ABSOLUTE ERROR', BLUE)
  );

  await until(S(9));
  await play(
    ...replace('error-b', [errorRow(P1, 'B')]),
    ...fbox([
      ['Tool B predicts 14 h', VIOLET],
      '|14 − 12|',
      ['error = 2 h', VIOLET]
    ], VIOLET),
    ...say('TOOL B: TWO HOURS OF ABSOLUTE ERROR', VIOLET)
  );

  await until(S(10));
  await play(
    ...replace('difference-badge', [differenceBadge(P1)]),
    ...fbox([
      ['A error = 6 h', BLUE],
      ['B error = 2 h', VIOLET],
      'difference = 6 − 2',
      ['= +4 h', VIOLET]
    ], VIOLET),
    ...say('SUBTRACT B’S ERROR FROM A’S ERROR')
  );

  await until(S(11));
  await play(
    ...indicate(get('error-b'), VIOLET),
    ...fbox([
      ['positive difference', VIOLET],
      'A made the larger error',
      ['B did better on P1', VIOLET]
    ], VIOLET),
    ...say('POSITIVE DIFFERENCE: TOOL B DID BETTER', VIOLET)
  );

  // ============================================================
  // 12–13: PUMP TWO
  //
  // Actual = 8.
  // A predicts 8, error = 0.
  // B predicts 10, error = 2.
  // Difference = 0 - 2 = -2.
  // ============================================================

  const P2 = DATA[1];

  await until(S(12));
  await play(
    ...clear('difference-badge'),
    ...replace('example-header', [exampleHeader(P2)]),
    ...replace('actual-guide', [actualGuide(P2)]),
    ...replace('error-a', [errorRow(P2, 'A')]),
    ...replace('error-b', [errorRow(P2, 'B')]),
    ...fbox([
      ['P2 actual = 8 h', WHITE],
      ['A error = 0 h', BLUE],
      ['B error = 2 h', VIOLET]
    ]),
    ...say('PUMP TWO: ZERO ERROR FOR A, TWO FOR B')
  );

  await until(S(13));
  await play(
    ...replace('difference-badge', [differenceBadge(P2)]),
    ...fbox([
      'difference = 0 − 2',
      ['= −2 h', BLUE],
      ['A did better on P2', BLUE]
    ], BLUE),
    ...say('NEGATIVE DIFFERENCE: TOOL A DID BETTER', BLUE)
  );

  // ============================================================
  // 14–16: CALCULATE ALL TWELVE PAIRED DIFFERENCES
  // ============================================================

  const pairedFrames = DATA.map(gridBase);
  const pairedErrors = DATA.map(gridErrors);
  const pairedDifferences = DATA.map(gridDifference);

  const pairedKey = text(
    'Difference = absolute error A − absolute error B',
    15, WHITE,
    CX,
    P ? -3.15 : -2.52,
    false, 6.55
  );

  await until(S(14));
  await play(
    ...clear(
      'example-axis',
      'example-header',
      'actual-guide',
      'error-a',
      'error-b',
      'difference-badge'
    ),
    ...fadeIn(pairedFrames),
    lag(fadeIn(pairedErrors), 1.55, 0.08),
    new M.FadeIn(pairedKey),
    ...fbox([
      ['for each pump', WHITE],
      ['calculate A’s absolute error', BLUE],
      ['calculate B’s absolute error', VIOLET],
      'subtract B from A'
    ]),
    ...say('CALCULATE THE DIFFERENCE FOR EVERY PUMP')
  );

  await until(S(15));
  await play(
    lag(
      fadeIn(pairedDifferences),
      2.05,
      0.10
    ),
    ...fbox([
      ['keep the pair together', GREEN],
      'two errors',
      'one pump',
      'one paired difference'
    ], GREEN),
    ...say('KEEP BOTH TOOLS’ RESULTS ON THE SAME CARD', GREEN)
  );

  await until(S(16));
  await play(
    lag(
      indicate(
        pairedDifferences,
        C.cyan,
        0.60
      ),
      3.90,
      0.17
    ),
    ...fbox([
      ['paired differences, hours', WHITE],
      '+4, −2, −2, +1',
      '−1, +2, −1, −1',
      '+1, +1,  0, +1'
    ]),
    ...say('TWELVE SIGNED ERROR DIFFERENCES')
  );

  // ============================================================
  // SIGNED-DIFFERENCE SUM
  //
  // Positive and negative differences remain distinct.
  // Their signed sum is used, not the sum of their magnitudes.
  // ============================================================

  const SUM_TILE_W = 1.32;
  const SUM_TILE_H = P ? 0.72 : 0.65;

  function differenceTile(d, x, y) {
    const color = differenceColor(d.difference);

    return group(
      rounded(
        x, y,
        SUM_TILE_W,
        SUM_TILE_H,
        color,
        color,
        0.09,
        1.6,
        0.09
      ),

      text(
        d.id,
        13, WHITE,
        x,
        y + 0.17,
        true
      ),

      text(
        signed(d.difference),
        22, color,
        x,
        y - 0.12,
        true
      )
    );
  }

  const sumTiles = DATA.map((d, i) =>
    differenceTile(
      d,
      CX + (i % 4 - 1.5) * 1.53,
      (P ? 1.07 : 1.02) -
        Math.floor(i / 4) * (P ? 1.05 : 0.83)
    )
  );

  const sumRuleY = P ? -1.66 : -1.35;

  const sumRule = line(
    CX - 2.95, sumRuleY,
    CX + 2.95, sumRuleY,
    C.muted, 2.2
  );

  const sumResult = text(
    'SUM = +3 HOURS',
    27, VIOLET,
    CX,
    P ? -2.13 : -1.75,
    true, 6.5
  );

  // ============================================================
  // 17: SUM = THREE HOURS
  // ============================================================

  await until(S(17));
  await play(
    ...fadeOut([
      ...pairedFrames,
      ...pairedErrors,
      ...pairedDifferences,
      pairedKey
    ]),
    lag(fadeIn(sumTiles), 1.05, 0.05),
    new M.Create(sumRule),
    new M.FadeIn(sumResult),
    ...fbox([
      '4 − 2 − 2 + 1 − 1 + 2',
      '− 1 − 1 + 1 + 1 + 0 + 1',
      ['= 3 hours', VIOLET]
    ], VIOLET),
    ...say('ADD THE SIGNED DIFFERENCES: THREE HOURS', VIOLET)
  );

  // ============================================================
  // 18: MEAN = 0.25 HOURS
  // ============================================================

  const meanResult = text(
    '3 ÷ 12 = 0.25 HOURS',
    27, VIOLET,
    CX,
    P ? -2.88 : -2.33,
    true, 6.5
  );

  await until(S(18));
  await play(
    new M.FadeIn(meanResult),
    ...fbox([
      ['sum = 3 hours', VIOLET],
      'number of pumps = 12',
      ['mean = 3/12 = 0.25 h', VIOLET]
    ], VIOLET),
    ...say('MEAN DIFFERENCE: ONE QUARTER OF AN HOUR', VIOLET)
  );

  // ============================================================
  // 19: FIFTEEN-MINUTE OBSERVED ADVANTAGE
  // ============================================================

  function maeBar(y, value, label, color) {
    const width = 4.55;
    const maxValue = 1.5;

    const left = CX - width / 2;
    const barWidth = value / maxValue * width;

    return group(
      text(
        label,
        18, color,
        CX, y + 0.42,
        false, 6.2
      ),

      rounded(
        CX, y,
        width, 0.32,
        C.muted,
        C.card,
        0.50,
        1.4,
        0.06
      ),

      rect(
        left + barWidth / 2,
        y,
        barWidth,
        0.32,
        color,
        0.80,
        1.4
      ),

      text(
        `${fmt(value, 3)} h`,
        19, WHITE,
        CX,
        y - 0.40,
        true
      )
    );
  }

  const maePicture = [
    maeBar(
      P ? 0.80 : 0.85,
      MAE_A,
      'Tool A mean absolute error',
      BLUE
    ),

    maeBar(
      P ? -0.70 : -0.46,
      MAE_B,
      'Tool B mean absolute error',
      VIOLET
    ),

    text(
      'B’s observed advantage = 15 minutes',
      22, VIOLET,
      CX,
      P ? -2.26 : -1.85,
      false, 6.5
    ),

    text(
      'On these twelve pumps',
      16, AMBER,
      CX,
      P ? -2.78 : -2.38,
      false
    )
  ];

  await until(S(19));
  await play(
    ...fadeOut([
      ...sumTiles,
      sumRule,
      sumResult,
      meanResult
    ]),
    ...replace('mae-picture', maePicture),
    ...fbox([
      ['0.25 hours × 60', WHITE],
      ['= 15 minutes', VIOLET],
      'observed advantage for B'
    ], VIOLET),
    ...say('TOOL B’S ERRORS ARE FIFTEEN MINUTES SMALLER ON AVERAGE', VIOLET)
  );

  // ============================================================
  // 20–21: PAIRED MODEL COMPARISON
  // ============================================================

  const pairY = P ? -0.35 : -0.30;

  function pairedExample(d, x, y) {
    return group(
      rounded(
        x, y,
        5.75, 2.70,
        GREEN,
        C.card,
        0.95,
        2.2,
        0.16
      ),

      pumpIcon(x, y + 0.83, 0.76),

      text(
        `${d.id} · one actual outcome: ${d.actual} h`,
        19, WHITE,
        x, y + 0.28,
        false, 5.35
      ),

      text(
        `A: ${d.a} h`,
        21, BLUE,
        x - 1.43, y - 0.27,
        true, 2.5
      ),

      text(
        `B: ${d.b} h`,
        21, VIOLET,
        x + 1.43, y - 0.27,
        true, 2.5
      ),

      text(
        `Error ${d.errorA}`,
        17, BLUE,
        x - 1.43, y - 0.72,
        true
      ),

      text(
        `Error ${d.errorB}`,
        17, VIOLET,
        x + 1.43, y - 0.72,
        true
      ),

      line(
        x, y - 0.02,
        x, y - 0.94,
        C.muted, 1.2
      ),

      text(
        'One paired difference',
        16, GREEN,
        x, y - 1.12,
        false
      )
    );
  }

  await until(S(20));
  await play(
    ...clear('mae-picture'),
    ...replace('paired-example', [
      pairedExample(P1, CX, pairY)
    ]),
    ...fbox([
      ['PAIRED MODEL COMPARISON', VIOLET],
      'compare both tools',
      'on the very same cases'
    ], VIOLET),
    ...say('THIS IS A PAIRED MODEL COMPARISON', VIOLET)
  );

  const pairedOutline = rounded(
    CX,
    pairY - 0.48,
    5.24,
    1.18,
    GREEN,
    GREEN,
    0,
    2.8,
    0.12
  );

  await until(S(21));
  await play(
    ...replace('pair-outline', [pairedOutline]),
    ...fbox([
      ['one pump', WHITE],
      ['prediction from A', BLUE],
      ['prediction from B', VIOLET],
      'keep them together'
    ], GREEN),
    ...say('EACH PAIR BELONGS TO THE VERY SAME PUMP', GREEN)
  );

  // ============================================================
  // 22: WHAT IF WE HAD ANOTHER GROUP?
  // ============================================================

  const futureCards = Array.from({ length: 12 }, (_, i) => {
    const x = CX + (i % 4 - 1.5) * 1.20;
    const y = (P ? 0.88 : 0.85) -
      Math.floor(i / 4) * 0.92;

    return group(
      rounded(
        x, y,
        1.04, 0.75,
        C.muted,
        C.card,
        0.55,
        1.3,
        0.08
      ),

      pumpIcon(
        x - 0.14, y,
        0.35,
        C.muted
      ),

      text(
        '?', 19, AMBER,
        x + 0.32, y,
        true
      )
    );
  });

  const unknownGroupCaption = text(
    'Would the mean difference stay the same?',
    19, AMBER,
    CX,
    P ? -2.42 : -1.82,
    false, 6.55
  );

  await until(S(22));
  await play(
    ...clear('paired-example', 'pair-outline'),
    ...replace('future-group', [
      ...futureCards,
      unknownGroupCaption
    ]),
    ...fbox([
      ['different evaluation pumps', AMBER],
      'might produce a different',
      'mean error difference'
    ], AMBER),
    ...say('WHAT IF WE HAD TESTED A DIFFERENT GROUP?', AMBER)
  );

  // ============================================================
  // BOOTSTRAP BAG
  //
  // The bag always contains the original twelve pump cards
  // after each draw has been returned.
  //
  // A sampled card is copied into the sample row.
  // The original card is not permanently removed.
  // ============================================================

  const BAG_X = CX - 1.66;
  const BAG_Y = P ? 0.72 : 0.55;

  const DRAW_X = CX + 1.70;
  const DRAW_Y = BAG_Y;

  function bagBody() {
    const w = 2.55;
    const h = 1.68;

    return group(
      rounded(
        BAG_X,
        BAG_Y - 0.10,
        w, h,
        C.cyan,
        C.card,
        0.96,
        2.3,
        0.32
      ),

      line(
        BAG_X - 0.94, BAG_Y + 0.68,
        BAG_X + 0.94, BAG_Y + 0.68,
        C.cyan, 3.0
      ),

      line(
        BAG_X - 0.94, BAG_Y + 0.68,
        BAG_X - 0.54, BAG_Y + 0.96,
        C.cyan, 2
      ),

      line(
        BAG_X + 0.94, BAG_Y + 0.68,
        BAG_X + 0.54, BAG_Y + 0.96,
        C.cyan, 2
      ),

      text(
        'ORIGINAL CARDS',
        15, C.cyan,
        BAG_X,
        BAG_Y + 0.32,
        true, 2.30
      )
    );
  }

  function bagContents(excluded = null) {
    return group(
      ...DATA.map((d, i) => {
        const x = BAG_X + (i % 6 - 2.5) * 0.35;
        const y = BAG_Y - 0.05 -
          Math.floor(i / 6) * 0.36;

        const hidden = i === excluded;

        return group(
          rounded(
            x, y,
            0.30, 0.29,
            hidden ? AMBER : C.muted,
            hidden ? C.card : C.cyan,
            hidden ? 0.0 : 0.11,
            1.1,
            0.035
          ),

          text(
            hidden ? '·' : d.id,
            10,
            hidden ? AMBER : WHITE,
            x, y,
            true, 0.28
          )
        );
      })
    );
  }

  function bagCount(n) {
    return text(
      `${n} cards in bag`,
      14,
      n === N ? GREEN : AMBER,
      BAG_X,
      BAG_Y - 0.75,
      false, 2.35
    );
  }

  function showBag() {
    return [
      ...replace('bag-body', [bagBody()]),
      ...replace('bag-contents', [bagContents()]),
      ...replace('bag-count', [bagCount(N)])
    ];
  }

  function hideBag() {
    return clear(
      'bag-body',
      'bag-contents',
      'bag-count',
      'draw-card',
      'draw-arrow',
      'return-arrow',
      'draw-note'
    );
  }

  function drawPreview(index) {
    const d = DATA[index];

    return completeDifferenceCard(
      d,
      DRAW_X,
      DRAW_Y - 0.02,
      P ? 1.08 : 0.98
    );
  }

  function drawArrow() {
    return group(
      arrow(
        BAG_X + 1.35,
        BAG_Y + 0.16,
        DRAW_X - 0.90,
        DRAW_Y + 0.16,
        AMBER
      ),

      text(
        'Draw',
        14, AMBER,
        CX,
        BAG_Y + 0.44,
        false
      )
    );
  }

  function returnArrow() {
    return group(
      arrow(
        DRAW_X - 0.90,
        DRAW_Y - 0.50,
        BAG_X + 1.35,
        BAG_Y - 0.50,
        GREEN
      ),

      text(
        'Return',
        14, GREEN,
        CX,
        BAG_Y - 0.78,
        false
      )
    );
  }

  // ============================================================
  // SAMPLE ROW
  //
  // A compact row of twelve cards. Every card carries the
  // pump ID and its complete paired error difference.
  //
  // The expanded preview beside the bag shows both original
  // absolute errors, making the pairing explicit.
  // ============================================================

  const ROW_PITCH = P ? 0.54 : 0.55;
  const ROW_CARD_W = ROW_PITCH - 0.045;

  const ROW_Y = P ? -1.12 : -1.08;

  const ROW_CARD_H = P ? 0.76 : 0.66;

  const rowX = j =>
    CX + (j - 5.5) * ROW_PITCH;

  let sampleCards = [];
  let sampleSlots = [];
  let sampleHeading = null;
  let sampleCalculation = null;
  let duplicateFrames = [];

  function emptySampleSlot(j) {
    return group(
      rounded(
        rowX(j),
        ROW_Y,
        ROW_CARD_W,
        ROW_CARD_H,
        C.muted,
        C.card,
        0.35,
        1.0,
        0.045
      ),

      text(
        String(j + 1),
        11, C.muted,
        rowX(j),
        ROW_Y,
        true, ROW_CARD_W - 0.05
      )
    );
  }

  function sampledCard(index, j) {
    const d = DATA[index];
    const color = differenceColor(d.difference);

    return group(
      rounded(
        rowX(j),
        ROW_Y,
        ROW_CARD_W,
        ROW_CARD_H,
        color,
        C.card,
        0.96,
        1.4,
        0.045
      ),

      text(
        d.id,
        12, WHITE,
        rowX(j),
        ROW_Y + ROW_CARD_H * 0.29,
        true, ROW_CARD_W - 0.05
      ),

      text(
        `${d.errorA}−${d.errorB}`,
        11, C.muted,
        rowX(j),
        ROW_Y + 0.01,
        true, ROW_CARD_W - 0.07
      ),

      text(
        signed(d.difference),
        15, color,
        rowX(j),
        ROW_Y - ROW_CARD_H * 0.29,
        true, ROW_CARD_W - 0.06
      )
    );
  }

  function showSampleSlots(trialNumber) {
    sampleHeading = text(
      `ROUND ${trialNumber} · 12 DRAWS WITH REPLACEMENT`,
      15, WHITE,
      CX,
      ROW_Y + ROW_CARD_H / 2 + 0.28,
      true, 6.55
    );

    sampleSlots = Array.from(
      { length: 12 },
      (_, j) => emptySampleSlot(j)
    );

    sampleCards = [];

    return [
      new M.FadeIn(sampleHeading),
      ...fadeIn(sampleSlots)
    ];
  }

  function addSampleCard(trial, j) {
    const card = sampledCard(trial.indices[j], j);

    const anims = [];

    if (sampleSlots[j]) {
      anims.push(new M.FadeOut(sampleSlots[j]));
      sampleSlots[j] = null;
    }

    sampleCards[j] = card;

    anims.push(new M.FadeIn(card));

    return anims;
  }

  function addSampleCards(trial, start = 0, end = 12) {
    const anims = [];

    for (let j = start; j < end; j++) {
      if (!sampleCards[j]) {
        anims.push(...addSampleCard(trial, j));
      }
    }

    return anims;
  }

  function clearDuplicateFrames() {
    const anims = fadeOut(duplicateFrames);

    duplicateFrames = [];

    return anims;
  }

  function highlightRepeatedPump(trial, pumpIndex) {
    const old = clearDuplicateFrames();

    duplicateFrames = trial.indices.flatMap((index, j) => {
      if (index !== pumpIndex || !sampleCards[j]) {
        return [];
      }

      return [
        rounded(
          rowX(j),
          ROW_Y,
          ROW_CARD_W + 0.035,
          ROW_CARD_H + 0.035,
          AMBER,
          AMBER,
          0,
          2.1,
          0.045
        )
      ];
    });

    return [
      ...old,
      ...duplicateFrames.map(o => new M.Create(o))
    ];
  }

  function clearSample() {
    const anims = [
      ...clearDuplicateFrames(),
      ...fadeOut([
        sampleHeading,
        sampleCalculation,
        ...sampleCards,
        ...sampleSlots
      ])
    ];

    sampleHeading = null;
    sampleCalculation = null;
    sampleCards = [];
    sampleSlots = [];

    return anims;
  }

  function showSampleCalculation(s, color = WHITE) {
    const old = sampleCalculation;

    sampleCalculation = text(
      s,
      P ? 23 : 19,
      color,
      CX,
      P ? -2.07 : -1.74,
      true, 6.55
    );

    return [
      ...(old ? [new M.FadeOut(old)] : []),
      new M.FadeIn(sampleCalculation)
    ];
  }

  // ============================================================
  // 23: PUT THE ORIGINAL CARDS INTO A BAG
  // ============================================================

  await until(S(23));
  await play(
    ...clear('future-group'),
    ...showBag(),
    ...fbox([
      ['bag contains 12 original pumps', WHITE],
      'each card keeps both errors',
      'and their signed difference'
    ]),
    ...say('PUT ALL TWELVE PAIRED CARDS INTO A BAG')
  );

  // ============================================================
  // 24: FIRST DRAW — P2
  // ============================================================

  const TRIAL1 = TRIALS[0];
  const TRIAL2 = TRIALS[1];
  const TRIAL3 = TRIALS[2];

  await until(S(24));
  await play(
    ...replace('bag-contents', [
      bagContents(TRIAL1.indices[0])
    ]),
    ...replace('bag-count', [bagCount(11)]),
    ...replace('draw-card', [
      drawPreview(TRIAL1.indices[0])
    ]),
    ...replace('draw-arrow', [drawArrow()]),
    ...showSampleSlots(1),
    ...addSampleCard(TRIAL1, 0),
    ...fbox([
      ['first draw: P2', WHITE],
      ['A error = 0', BLUE],
      ['B error = 2', VIOLET],
      ['record difference = −2 h', BLUE]
    ], BLUE),
    ...say('DRAW ONE CARD AND RECORD ITS DIFFERENCE')
  );

  // ============================================================
  // 25: RETURN THE CARD BEFORE THE NEXT DRAW
  // ============================================================

  await until(S(25));
  await play(
    ...clear('draw-arrow', 'draw-card'),
    ...replace('bag-contents', [bagContents()]),
    ...replace('bag-count', [bagCount(12)]),
    ...replace('return-arrow', [returnArrow()]),
    ...fbox([
      ['keep the recorded difference', WHITE],
      'return the original card',
      ['bag contains 12 cards again', GREEN]
    ], GREEN),
    ...say('RETURN THE CARD BEFORE DRAWING AGAIN', GREEN)
  );

  // ============================================================
  // 26: DRAWING WITH REPLACEMENT
  //
  // The second exact draw is P10.
  // P2 is once again eligible to be drawn because it was returned.
  // The completed trial will contain P2 three times.
  // ============================================================

  const replacementNote = text(
    'Every pump is eligible again on every draw',
    15, GREEN,
    CX,
    P ? -2.04 : -1.28,
    false, 6.5
  );

  await until(S(26));
  await play(
    ...clear('return-arrow'),
    ...replace('draw-card', [
      drawPreview(TRIAL1.indices[1])
    ]),
    ...replace('draw-arrow', [drawArrow()]),
    ...replace('draw-note', [replacementNote]),
    ...addSampleCard(TRIAL1, 1),
    ...fbox([
      ['drawing with replacement', GREEN],
      'some pumps may appear repeatedly',
      'other pumps may be absent'
    ], GREEN),
    ...say('REPEATED PUMPS ARE ALLOWED')
  );

  // ============================================================
  // 27–29: EXPLAIN THE BOOTSTRAP SAMPLE
  // ============================================================

  await until(S(27));
  await play(
    ...clear('draw-card', 'draw-arrow'),
    ...replace('return-arrow', [returnArrow()]),
    ...fbox([
      ['complete 12 draws', WHITE],
      'draw from the original 12 pumps',
      'replace after every draw',
      'record 12 paired differences'
    ]),
    ...say('TWELVE DRAWS MAKE ONE NEW SAMPLE')
  );

  await until(S(28));
  await play(
    ...clear('draw-note'),
    ...fbox([
      ['original mean = +0.25 h', VIOLET],
      'a resampled group',
      'may give a different mean'
    ], AMBER),
    ...say('HOW MUCH MIGHT THE MEAN DIFFERENCE CHANGE?', AMBER)
  );

  await until(S(29));
  await play(
    ...clear('return-arrow'),
    ...fbox([
      ['BOOTSTRAP', VIOLET],
      'resample existing observations',
      'with replacement',
      'and recalculate the statistic'
    ], VIOLET),
    ...say('THIS RESAMPLING METHOD IS CALLED THE BOOTSTRAP', VIOLET)
  );

  // ============================================================
  // 30–32: COMPLETE THE FIRST EXACT TRIAL
  //
  // P2, P10, P8, P6, P6, P11,
  // P2, P9, P3, P2, P7, P12.
  //
  // Differences:
  // -2, 1, -1, 2, 2, 0, -2, 1, -2, -2, -1, 1.
  //
  // Sum = -3.
  // Mean = -0.25 hours.
  // ============================================================

  await until(S(30));
  await play(
    lag(
      addSampleCards(TRIAL1, 2, 12),
      3.65,
      0.10
    ),
    ...fbox([
      ['round 1: 12 draws', WHITE],
      'P2 appears three times',
      'P6 appears twice',
      'the bag still contains 12 cards'
    ]),
    ...say('COMPLETE THE FIRST TWELVE DRAWS')
  );

  await until(S(31));
  await play(
    ...highlightRepeatedPump(TRIAL1, 1),
    ...showSampleCalculation(
      `SUM = ${signed(TRIAL1.sum)} HOURS`,
      BLUE
    ),
    ...fbox([
      '−2 + 1 − 1 + 2 + 2 + 0',
      '−2 + 1 − 2 − 2 − 1 + 1',
      ['= −3 hours', BLUE]
    ], BLUE),
    ...say('ROUND ONE: THE DIFFERENCES SUM TO MINUS THREE', BLUE)
  );

  await until(S(32));
  await play(
    ...clearDuplicateFrames(),
    ...showSampleCalculation(
      '−3 ÷ 12 = −0.25 h',
      BLUE
    ),
    ...fbox([
      ['round 1 sum = −3', BLUE],
      'divide by 12 drawn cards',
      ['mean = −0.25 hours', BLUE],
      'Tool A did better in this round'
    ], BLUE),
    ...say('ROUND ONE MEAN: MINUS ONE QUARTER HOUR', BLUE)
  );

  // ============================================================
  // EARLY BOOTSTRAP DOT PLOT
  //
  // Keep the sample row above the plot.
  // Every dot represents ONE completed bootstrap round.
  //
  // Use the same horizontal scale as the later histogram.
  // ============================================================

  const HX0 = CX - 2.80;
  const HX1 = CX + 2.80;

  const HMIN = -1.5;
  const HMAX = 3.0;

  const HW = HX1 - HX0;

  const hx = v =>
    HX0 + (v - HMIN) / (HMAX - HMIN) * HW;

  const EARLY_BASE = P ? -4.28 : -2.95;

  const X_TICKS = [-1, 0, 1, 2, 3];

  function horizontalScale(base) {
    return group(
      line(
        HX0, base,
        HX1, base,
        C.muted, 2.4
      ),

      ...X_TICKS.flatMap(v => [
        line(
          hx(v), base - 0.065,
          hx(v), base + 0.065,
          v === 0 ? WHITE : C.muted,
          v === 0 ? 2.5 : 1.4
        ),

        text(
          String(v).replace('-', '−'),
          14, WHITE,
          hx(v),
          base - 0.23,
          true
        )
      ]),

      text(
        'Mean difference (hours)',
        15, WHITE,
        CX,
        base - 0.50,
        false, 6.2
      )
    );
  }

  const earlyAxis = horizontalScale(EARLY_BASE);

  const earlyZero = dashed(
    hx(0),
    EARLY_BASE,
    hx(0),
    EARLY_BASE + (P ? 1.12 : 0.66),
    WHITE,
    1.7
  );

  let earlyDots = [];
  let earlyDotLabel = null;
  let earlyCount = null;

  function makeEarlyDot(trial) {
    const color = differenceColor(trial.mean);

    return group(
      circle(
        hx(trial.mean),
        EARLY_BASE + 0.19,
        0.105,
        color,
        0.18,
        1
      ),

      circle(
        hx(trial.mean),
        EARLY_BASE + 0.19,
        0.060,
        color,
        1,
        1.5
      )
    );
  }

  function plotEarlyTrial(trial) {
    const dot = makeEarlyDot(trial);

    earlyDots.push(dot);

    const oldLabel = earlyDotLabel;
    const oldCount = earlyCount;

    const valueLabel = trial.number === 3
      ? '+0.167'
      : signed(trial.mean, 2);

    earlyDotLabel = text(
      valueLabel,
      16,
      differenceColor(trial.mean),
      hx(trial.mean) +
        (trial.number === 3 ? 0.42 : -0.37),
      EARLY_BASE + (P ? 0.70 : 0.54),
      true, 1.06
    );

    earlyCount = text(
      `Completed rounds: ${trial.number}`,
      15, C.cyan,
      CX + 1.76,
      EARLY_BASE + (P ? 1.04 : 0.79),
      true, 2.35
    );

    return [
      ...(oldLabel ? [new M.FadeOut(oldLabel)] : []),
      ...(oldCount ? [new M.FadeOut(oldCount)] : []),
      new M.FadeIn(dot),
      new M.FadeIn(earlyDotLabel),
      new M.FadeIn(earlyCount)
    ];
  }

  function hideEarlyPlot() {
    const anims = fadeOut([
      earlyAxis,
      earlyZero,
      ...earlyDots,
      earlyDotLabel,
      earlyCount
    ]);

    earlyDots = [];
    earlyDotLabel = null;
    earlyCount = null;

    return anims;
  }

  // ============================================================
  // 33: PLACE THE FIRST DOT AT -0.25
  // ============================================================

  await until(S(33));
  await play(
    new M.FadeIn(earlyAxis),
    new M.Create(earlyZero),
    ...plotEarlyTrial(TRIAL1),
    ...fbox([
      ['one completed round', WHITE],
      ['one mean difference', BLUE],
      ['one dot at −0.25 h', BLUE]
    ], BLUE),
    ...say('PLOT THE FIRST BOOTSTRAP RESULT', BLUE)
  );

  // ============================================================
  // 34–36: SECOND EXACT TRIAL
  //
  // P9, P10, P9, P10, P7, P2,
  // P11, P6, P7, P5, P3, P12.
  //
  // Sum = 0.
  // Mean = 0.
  // ============================================================

  // A fresh row is made from the existing original cards.
  // The previous sample is discarded, but its plotted result stays.

  await until(S(34));

  const clearFirstRow = clearSample();
  const secondRowSlots = showSampleSlots(2);

  // Empty-slot animations are unnecessary when all twelve
  // positions will immediately be populated in the same beat.
  // Keep only the heading, then reveal the twelve sampled cards.

  const secondHeading = secondRowSlots[0];

  sampleSlots = Array(12).fill(null);

  await play(
    ...clearFirstRow,
    secondHeading,
    lag(
      addSampleCards(TRIAL2),
      3.55,
      0.12
    ),
    ...replace('bag-contents', [bagContents()]),
    ...replace('bag-count', [bagCount(12)]),
    ...fbox([
      ['round 2', WHITE],
      'discard the previous sample row',
      'draw twelve cards again',
      'always replace each card'
    ]),
    ...say('REPEAT TWELVE DRAWS WITH REPLACEMENT')
  );

  await until(S(35));
  await play(
    ...showSampleCalculation(
      'SUM = 0 · MEAN = 0/12 = 0',
      WHITE
    ),
    ...fbox([
      '1 + 1 + 1 + 1 − 1 − 2',
      '+ 0 + 2 − 1 − 1 − 2 + 1',
      ['sum = 0', WHITE],
      ['mean = 0 hours', WHITE]
    ]),
    ...say('ROUND TWO: THE MEAN DIFFERENCE IS ZERO')
  );

  await until(S(36));
  await play(
    ...plotEarlyTrial(TRIAL2),
    ...fbox([
      ['second bootstrap dot = 0', WHITE],
      'neither tool has an advantage',
      'in this resampled group'
    ]),
    ...say('PLACE THE SECOND DOT AT ZERO')
  );

  // ============================================================
  // 37–40: THIRD EXACT TRIAL
  //
  // P10, P8, P5, P10, P7, P6,
  // P6, P3, P2, P7, P11, P1.
  //
  // Sum = 2.
  // Mean = 2/12 = 0.166666...
  // ============================================================

  await until(S(37));

  const clearSecondRow = clearSample();
  const thirdRowSlots = showSampleSlots(3);
  const thirdHeading = thirdRowSlots[0];

  sampleSlots = Array(12).fill(null);

  await play(
    ...clearSecondRow,
    thirdHeading,
    lag(
      addSampleCards(TRIAL3),
      2.90,
      0.11
    ),
    ...fbox([
      ['round 3', WHITE],
      'same original bag',
      'twelve new draws',
      'keep the paired differences'
    ]),
    ...say('COMPLETE THE THIRD ROUND')
  );

  await until(S(38));
  await play(
    ...showSampleCalculation(
      'SUM = +2 HOURS',
      VIOLET
    ),
    ...fbox([
      '1 − 1 − 1 + 1 − 1 + 2',
      '+ 2 − 2 − 2 − 1 + 0 + 4',
      ['= 2 hours', VIOLET]
    ], VIOLET),
    ...say('ROUND THREE: THE DIFFERENCES SUM TO TWO', VIOLET)
  );

  await until(S(39));
  await play(
    ...showSampleCalculation(
      '2 ÷ 12 ≈ +0.167 h',
      VIOLET
    ),
    ...fbox([
      ['sum = 2 hours', VIOLET],
      'divide by 12',
      ['mean ≈ +0.167 hours', VIOLET],
      'Tool B did better in this round'
    ], VIOLET),
    ...say('ROUND THREE MEAN: ABOUT PLUS 0.17 HOURS', VIOLET)
  );

  await until(S(40));
  await play(
    ...plotEarlyTrial(TRIAL3),
    ...fbox([
      ['three completed rounds', WHITE],
      ['−0.25', BLUE],
      ['0', WHITE],
      ['+0.167', VIOLET]
    ]),
    ...say('THIRD DOT: ABOUT PLUS 0.17 HOURS', VIOLET)
  );

  // ============================================================
  // FULL BOOTSTRAP HISTOGRAM
  //
  // Horizontal axis: mean difference, in hours.
  // Vertical axis: number of completed bootstrap rounds.
  //
  // Each histogram column corresponds to one possible
  // integer sum divided by twelve.
  //
  // Every displayed height is derived from exact NumPy
  // simulation counts.
  //
  // The vertical scale changes explicitly as the number of
  // trials grows. No fixed-height bars are passed off as
  // increasing absolute counts.
  // ============================================================

  const HIST_BASE = P ? -3.92 : -2.13;
  const HIST_TOP = P ? 0.45 : 0.75;

  const HIST_H = HIST_TOP - HIST_BASE;

  const BIN_SPACING =
    HW / (HMAX - HMIN) / N;

  const BIN_W = BIN_SPACING * 0.84;

  const HIST_SCALES = {
    30: {
      max: 10,
      ticks: [0, 2, 4, 6, 8, 10]
    },

    100: {
      max: 15,
      ticks: [0, 5, 10, 15]
    },

    1000: {
      max: 80,
      ticks: [0, 20, 40, 60, 80]
    },

    10000: {
      max: 700,
      ticks: [0, 175, 350, 525, 700]
    }
  };

  function hy(count, max) {
    return HIST_BASE + count / max * HIST_H;
  }

  const histAxis = horizontalScale(HIST_BASE);

  const histVertical = line(
    HX0, HIST_BASE,
    HX0, HIST_TOP,
    C.muted, 2
  );

  const histYLabel = text(
    'Number of bootstrap rounds',
    15, WHITE,
    CX,
    HIST_TOP + 0.80,
    false, 6.3
  );

  const negativeMeaning = text(
    'A smaller error',
    14, BLUE,
    CX - 1.66,
    HIST_BASE - (P ? 0.95 : 0.77),
    false, 2.60
  );

  const positiveMeaning = text(
    'B smaller error',
    14, VIOLET,
    CX + 1.66,
    HIST_BASE - (P ? 0.95 : 0.77),
    false, 2.60
  );

  const histZero = dashed(
    hx(0),
    HIST_BASE,
    hx(0),
    HIST_TOP,
    WHITE,
    1.8
  );

  let histogramBars = [];
  let histogramGrid = null;
  let histogramCounter = null;
  let histogramDecoration = [];
  let histogramVisible = false;
  let histogramN = 0;

  let intervalObjects = [];
  let observedObjects = [];

  function makeHistogramGrid(n) {
    const { max, ticks } = HIST_SCALES[n];

    return group(
      ...ticks.flatMap(value => {
        const y = hy(value, max);

        return [
          line(
            HX0 - 0.055, y,
            HX0 + 0.055, y,
            C.muted, 1.3
          ),

          text(
            String(value),
            13, WHITE,
            HX0 - 0.31,
            y,
            true, 0.55
          ),

          ...(value > 0
            ? [
                line(
                  HX0, y,
                  HX1, y,
                  C.muted, 0.6
                )
              ]
            : [])
        ];
      })
    );
  }

  function makeHistogramBar(i, count, max) {
    const mean = (MIN_SUM + i) / N;
    const x = hx(mean);

    const color = differenceColor(mean);

    // A zero-count bin is represented by an invisible
    // baseline-sized shape. It has no displayed positive height.
    const height = count === 0
      ? 0.001
      : count / max * HIST_H;

    return rect(
      x,
      HIST_BASE + height / 2,
      BIN_W,
      height,
      color,
      count === 0 ? 0 : 0.86,
      count === 0 ? 0 : 0.8
    );
  }

  function makeCounter(n) {
    const tag = pill(
      `ROUNDS: ${n.toLocaleString('en-US')}`,
      C.cyan,
      18
    );

    tag.moveTo([
      P ? CX : 4.3,
      P ? 1.73 : 1.20,
      0
    ]);

    return tag;
  }

  function showHistogramAxes() {
    histogramDecoration = [
      horizontalScale(HIST_BASE),

      line(
        HX0, HIST_BASE,
        HX0, HIST_TOP,
        C.muted, 2
      ),

      text(
        'Number of bootstrap rounds',
        15, WHITE,
        CX,
        HIST_TOP + 0.80,
        false, 6.3
      ),

      text(
        'A smaller error',
        14, BLUE,
        CX - 1.66,
        HIST_BASE - (P ? 0.95 : 0.77),
        false, 2.60
      ),

      text(
        'B smaller error',
        14, VIOLET,
        CX + 1.66,
        HIST_BASE - (P ? 0.95 : 0.77),
        false, 2.60
      )
    ];

    histogramVisible = true;

    return fadeIn(histogramDecoration);
  }

  function clearInterval() {
    const anims = fadeOut(intervalObjects);

    intervalObjects = [];

    return anims;
  }

  function clearObservedMean() {
    const anims = fadeOut(observedObjects);

    observedObjects = [];

    return anims;
  }

  function updateHistogram(n, animate = true) {
    const counts = HISTOGRAMS[n];
    const { max } = HIST_SCALES[n];

    const nextGrid = makeHistogramGrid(n);
    const nextCounter = makeCounter(n);

    const anims = [
      ...(histogramGrid
        ? [new M.FadeOut(histogramGrid)]
        : []),

      ...(histogramCounter
        ? [new M.FadeOut(histogramCounter)]
        : []),

      new M.FadeIn(nextGrid),
      new M.FadeIn(nextCounter)
    ];

    histogramGrid = nextGrid;
    histogramCounter = nextCounter;

    const nextBars = counts.map((count, i) =>
      makeHistogramBar(i, count, max)
    );

    if (histogramBars.length === 0) {
      histogramBars = nextBars;

      anims.push(
        animate
          ? lag(
              fadeIn(histogramBars),
              1.45,
              0.025
            )
          : new M.LaggedStart(
              fadeIn(histogramBars),
              { lagRatio: 0.01, runTime: 0.8 }
            )
      );
    } else {
      const transforms = histogramBars.map((bar, i) =>
        new M.Transform(bar, nextBars[i])
      );

      anims.push(
        lag(
          transforms,
          animate ? 2.10 : 0.8,
          0.018
        )
      );
    }

    histogramN = n;

    return anims;
  }

  function hideHistogram() {
    if (!histogramVisible) return [];

    const anims = [
      ...clearInterval(),
      ...clearObservedMean(),
      ...fadeOut([
        ...histogramDecoration,
        ...histogramBars,
        histogramGrid,
        histogramCounter
      ])
    ];

    histogramBars = [];
    histogramGrid = null;
    histogramCounter = null;
    histogramDecoration = [];
    histogramVisible = false;
    histogramN = 0;

    return anims;
  }

  // ============================================================
  // 41: COMPUTER REPEATS THE RESAMPLING QUICKLY
  //
  // Begin with the actual first thirty trials as a dot plot.
  // The exact count in each stack is taken from the NumPy
  // checkpoint, including the three trials already shown.
  // ============================================================

  const thirtyDots = HISTOGRAMS[30].flatMap((count, i) => {
    const mean = (MIN_SUM + i) / N;

    return Array.from({ length: count }, (_, j) =>
      circle(
        hx(mean),
        HIST_BASE + (j + 0.5) * HIST_H / 10,
        Math.min(0.045, BIN_W * 0.48),
        differenceColor(mean),
        1,
        1
      )
    );
  });

  const thirtyGrid = makeHistogramGrid(30);
  const thirtyCounter = makeCounter(30);

  await until(S(41));
  await play(
    ...hideBag(),
    ...clearSample(),
    ...hideEarlyPlot(),
    ...showHistogramAxes(),
    new M.FadeIn(thirtyGrid),
    new M.FadeIn(thirtyCounter),
    lag(
      fadeIn(thirtyDots),
      3.85,
      0.065
    ),
    ...fbox([
      ['one round = 12 draws', WHITE],
      'calculate the mean',
      'record one result',
      ['repeat quickly', C.cyan]
    ]),
    ...say('REPEAT MANY TIMES AND BUILD PILES OF RESULTS')
  );

  // ============================================================
  // PERCENTILE INTERVAL
  //
  // Lower endpoint: 2.5th percentile.
  // Upper endpoint: 97.5th percentile.
  //
  // A shaded band marks the central percentile range.
  // The endpoints are exact numerical coordinates.
  //
  // Because the distribution is discrete and percentile
  // interpolation is used, the displayed range need not contain
  // exactly 95% of the finite simulated points.
  // ============================================================

  function makeIntervalObjects(ci) {
    const left = hx(ci.lower);
    const right = hx(ci.upper);

    const bracketY = HIST_TOP + 0.13;

    const labelY = HIST_TOP - 0.24;

    const width = right - left;

    return [
      rect(
        (left + right) / 2,
        HIST_BASE + HIST_H / 2,
        width,
        HIST_H,
        GREEN,
        0.075,
        0.6
      ),

      dashed(
        left, HIST_BASE,
        left, HIST_TOP,
        GREEN, 2.0
      ),

      dashed(
        right, HIST_BASE,
        right, HIST_TOP,
        GREEN, 2.0
      ),

      line(
        left, bracketY,
        right, bracketY,
        GREEN, 2.8
      ),

      line(
        left, bracketY - 0.095,
        left, bracketY + 0.095,
        GREEN, 2.5
      ),

      line(
        right, bracketY - 0.095,
        right, bracketY + 0.095,
        GREEN, 2.5
      ),

      text(
        'Middle 95%',
        16, GREEN,
        (left + right) / 2,
        bracketY + 0.24,
        false, Math.max(1.4, width + 0.1)
      ),

      text(
        fmt(ci.lower, 2),
        15, GREEN,
        left - 0.08,
        labelY,
        true, 0.81
      ),

      text(
        fmt(ci.upper, 2),
        15, GREEN,
        right + 0.08,
        labelY,
        true, 0.81
      )
    ];
  }

  function updateInterval(ci) {
    const old = clearInterval();

    intervalObjects = makeIntervalObjects(ci);

    return [
      ...old,
      ...fadeIn(intervalObjects)
    ];
  }

  // ============================================================
  // 42: ONE HUNDRED TRIALS
  //
  // Exact percentile interval:
  // approximately [-0.544, 1.333] hours.
  // ============================================================

  await until(S(42));
  await play(
    ...fadeOut([
      ...thirtyDots,
      thirtyGrid,
      thirtyCounter
    ]),
    ...updateHistogram(100),
    ...updateInterval(CI100),
    ...fbox([
      ['100 completed rounds', C.cyan],
      'middle 95% of means:',
      [`${fmt(CI100.lower, 3)} to ${fmt(CI100.upper, 3)} h`, GREEN]
    ], GREEN),
    ...say('100 ROUNDS: ABOUT −0.54 TO +1.33 HOURS', GREEN)
  );

  // ============================================================
  // 43: ONE THOUSAND TRIALS
  //
  // Exact percentile interval:
  // approximately [-0.667, 1.250] hours.
  // ============================================================

  await until(S(43));
  await play(
    ...clearInterval(),
    ...updateHistogram(1000),
    ...updateInterval(CI1000),
    ...fbox([
      ['1,000 completed rounds', C.cyan],
      'middle 95% of means:',
      [`${fmt(CI1000.lower, 3)} to ${fmt(CI1000.upper, 3)} h`, GREEN]
    ], GREEN),
    ...say('1,000 ROUNDS: ABOUT −0.67 TO +1.25 HOURS', GREEN)
  );

  // ============================================================
  // 44: TEN THOUSAND TRIALS
  //
  // The interval endpoints are unchanged from the 1,000-trial
  // checkpoint in this fixed demonstration.
  //
  // This is greater simulation stability, not new information
  // from additional real pumps.
  // ============================================================

  await until(S(44));
  await play(
    ...updateHistogram(10000),
    ...indicate(intervalObjects.slice(3, 6), GREEN),
    ...fbox([
      ['10,000 completed rounds', C.cyan],
      [`lower ≈ ${fmt(CI10000.lower, 3)} h`, GREEN],
      [`upper ≈ ${fmt(CI10000.upper, 3)} h`, GREEN],
      'endpoints have barely changed'
    ], GREEN),
    ...say('10,000 ROUNDS: THE INTERVAL HAS STABILISED', GREEN)
  );

  // ============================================================
  // 45: NAME THE BOOTSTRAP CONFIDENCE INTERVAL
  // ============================================================

  const confidenceName = text(
    '95% BOOTSTRAP CONFIDENCE INTERVAL',
    17, GREEN,
    P ? CX : 4.3,
    P ? -5.32 : -1.90,
    true,
    P ? 6.6 : 4.2
  );

  await until(S(45));
  await play(
    ...replace('confidence-name', [confidenceName]),
    ...fbox([
      ['BOOTSTRAP CONFIDENCE INTERVAL', GREEN],
      'describes uncertainty about',
      'the overall mean difference',
      'using repeated resampling'
    ], GREEN),
    ...say('THIS IS A BOOTSTRAP CONFIDENCE INTERVAL', GREEN)
  );

  // ============================================================
  // 46–47: THE FORMULA BEHIND EACH ROUND
  //
  // Mean difference =
  // sum of drawn paired differences / number of drawn cards.
  //
  // Formula is introduced after the learner has seen the
  // calculation performed three times.
  // ============================================================

  const FORMULA_Y = P ? -0.75 : -0.50;

  const FORMULA_W = 6.45;
  const FORMULA_H = P ? 3.45 : 2.95;

  const formulaFrame = rounded(
    CX,
    FORMULA_Y,
    FORMULA_W,
    FORMULA_H,
    VIOLET,
    C.card,
    0.95,
    2,
    0.16
  );

  const formulaTitle = text(
    'ONE BOOTSTRAP ROUND',
    20, VIOLET,
    CX,
    FORMULA_Y + FORMULA_H / 2 - 0.30,
    true, FORMULA_W - 0.35
  );

  const formulaMiniRow = TRIAL1.indices.map((index, j) => {
    const d = DATA[index];
    const x = CX + (j - 5.5) * 0.46;

    return group(
      rounded(
        x,
        FORMULA_Y + 0.55,
        0.41,
        0.48,
        differenceColor(d.difference),
        C.card,
        0.96,
        1.2,
        0.045
      ),

      text(
        d.id,
        10, WHITE,
        x,
        FORMULA_Y + 0.66,
        true, 0.37
      ),

      text(
        signed(d.difference),
        14, differenceColor(d.difference),
        x,
        FORMULA_Y + 0.44,
        true, 0.37
      )
    );
  });

  await until(S(46));
  await play(
    ...hideHistogram(),
    ...clear('confidence-name'),
    ...clearBox(),
    ...replace('formula-frame', [
      formulaFrame,
      formulaTitle,
      ...formulaMiniRow
    ]),
    ...say('WRITE THE CALCULATION FOR EACH ROUND')
  );

  const formulaNumerator = text(
    'Sum of drawn paired error differences',
    20, VIOLET,
    CX,
    FORMULA_Y - 0.05,
    true, FORMULA_W - 0.52
  );

  const formulaLine = line(
    CX - FORMULA_W / 2 + 0.52,
    FORMULA_Y - 0.29,
    CX + FORMULA_W / 2 - 0.52,
    FORMULA_Y - 0.29,
    WHITE, 2.2
  );

  const formulaDenominator = text(
    'Number of drawn cards',
    20, WHITE,
    CX,
    FORMULA_Y - 0.57,
    true, FORMULA_W - 0.52
  );

  const formulaExample = text(
    'Round 1: −3 / 12 = −0.25 h',
    22, BLUE,
    CX,
    FORMULA_Y - 1.08,
    true, FORMULA_W - 0.45
  );

  await until(S(47));
  await play(
    ...replace('formula-terms', [
      formulaNumerator,
      formulaLine,
      formulaDenominator,
      formulaExample
    ]),
    ...fbox([
      ['mean difference', VIOLET],
      'sum of drawn error differences',
      '÷ number of drawn cards',
      ['example: −3/12 = −0.25', BLUE]
    ], VIOLET),
    ...say('SUM THE DRAWN DIFFERENCES AND DIVIDE BY THE COUNT')
  );

  // ============================================================
  // 48: KEEP THE MIDDLE 95%
  //
  // Restore the exact 10,000-trial histogram.
  // Show the percentile cutoffs and distinguish the two tails.
  // ============================================================

  function tailLabels(ci) {
    const left = hx(ci.lower);
    const right = hx(ci.upper);

    return [
      text(
        '2.5% tail',
        13, AMBER,
        (HX0 + left) / 2,
        HIST_TOP - 0.63,
        false, 1.18
      ),

      text(
        '2.5% tail',
        13, AMBER,
        (right + HX1) / 2,
        HIST_TOP - 0.63,
        false, 1.18
      ),

      text(
        '2.5th percentile',
        12, GREEN,
        left,
        HIST_BASE + 0.34,
        false, 1.42
      ),

      text(
        '97.5th percentile',
        12, GREEN,
        right,
        HIST_BASE + 0.34,
        false, 1.42
      )
    ];
  }

  await until(S(48));
  await play(
    ...clear('formula-frame', 'formula-terms'),
    ...showHistogramAxes(),
    ...updateHistogram(10000, false),
    ...updateInterval(CI10000),
    ...replace('tail-labels', tailLabels(CI10000)),
    ...fbox([
      ['lower = 2.5th percentile', GREEN],
      ['upper = 97.5th percentile', GREEN],
      'central percentile range = 95%'
    ], GREEN),
    ...say('KEEP THE MIDDLE NINETY-FIVE PERCENT', GREEN)
  );

  // ============================================================
  // 49: THE INTERVAL CONTAINS ZERO
  //
  // Negative means favour A.
  // Positive means favour B.
  // Zero means no overall mean error difference.
  //
  // The observed mean is +0.25 hours, but the confidence
  // interval spans both sides of zero.
  // ============================================================

  function zeroReference() {
    return group(
      dashed(
        hx(0),
        HIST_BASE,
        hx(0),
        HIST_TOP,
        WHITE,
        2.8
      ),

      circle(
        hx(0),
        HIST_TOP + 0.13,
        0.10,
        WHITE,
        1,
        1.4
      )
    );
  }

  const zeroInsideTag = pill(
    'ZERO IS INSIDE',
    AMBER,
    18
  );

  zeroInsideTag.moveTo([
    P ? CX : 4.3,
    P ? -5.40 : -1.86,
    0
  ]);

  await until(S(49));
  await play(
    ...clear('tail-labels'),
    ...replace('zero-reference', [zeroReference()]),
    ...replace('zero-tag', [zeroInsideTag]),
    ...fbox([
      ['95% bootstrap interval', GREEN],
      `${fmt(CI10000.lower, 2)} to +${fmt(CI10000.upper, 2)} hours`,
      ['negative ← 0 → positive', WHITE],
      ['zero is inside', AMBER]
    ], AMBER),
    ...say('THE FINAL INTERVAL INCLUDES ZERO', AMBER)
  );

  // ============================================================
  // 50: NO CONVINCING OVERALL ADVANTAGE
  //
  // Show the original observed mean separately from the
  // bootstrap confidence interval.
  //
  // The observed difference remains +0.25 hours.
  // The interval is much wider and crosses zero.
  // ============================================================

  function showObservedMean() {
    const old = clearObservedMean();

    const x = hx(OBSERVED_MEAN);

    observedObjects = [
      dashed(
        x,
        HIST_BASE,
        x,
        HIST_TOP - 0.48,
        VIOLET,
        1.8
      ),

      text(
        'Observed mean',
        16, VIOLET,
        hx(2.1),
        HIST_TOP - 0.41,
        false, 1.80
      ),

      text(
        '+0.25 h',
        17, VIOLET,
        hx(2.1),
        HIST_TOP - 0.68,
        true, 1.35
      )
    ];

    return [
      ...old,
      ...fadeIn(observedObjects)
    ];
  }

  await until(S(50));
  await play(
    ...showObservedMean(),
    ...fbox([
      ['observed advantage for B = 0.25 h', VIOLET],
      'but uncertainty spans both signs',
      ['no convincing overall winner', AMBER]
    ], AMBER),
    ...say('THESE TWELVE PUMPS DO NOT GIVE A CONVINCING WINNER', AMBER)
  );

  // ============================================================
  // 51: ABSENCE OF CONVINCING EVIDENCE IS NOT PROOF OF EQUALITY
  // ============================================================

  await until(S(51));
  await play(
    ...indicate(get('zero-tag'), AMBER),
    ...fbox([
      ['no convincing difference', AMBER],
      'does NOT mean',
      ['the tools are equally good', WHITE],
      'uncertainty remains'
    ], AMBER),
    ...say('THIS DOES NOT PROVE THE TWO TOOLS ARE EQUAL', AMBER)
  );

  // ============================================================
  // 52: WHEN PAIRED BOOTSTRAP COMPARISON IS APPROPRIATE
  //
  // Compare both models on the same cases.
  // Resample whole paired observations.
  // Cases should be independent and representative of the
  // intended future prediction setting.
  // ============================================================

  const CONDITIONS_Y = P
    ? [1.04, -0.65, -2.34]
    : [0.98, -0.36, -1.70];

  const CONDITIONS_H = P ? 1.39 : 1.13;

  function conditionPanel(j, title, detail, color, icon) {
    const y = CONDITIONS_Y[j];

    return group(
      rounded(
        CX, y,
        6.40,
        CONDITIONS_H,
        color,
        C.card,
        0.95,
        1.8,
        0.12
      ),

      icon,

      text(
        title,
        19, color,
        CX + 0.73,
        y + 0.20,
        false, 4.68
      ),

      text(
        detail,
        15, WHITE,
        CX + 0.73,
        y - 0.20,
        false, 4.68
      )
    );
  }

  const pairedIcon = group(
    rounded(
      CX - 2.26,
      CONDITIONS_Y[0],
      1.22, 0.68,
      GREEN,
      C.card,
      0.94,
      1.6,
      0.08
    ),

    text(
      'A',
      19, BLUE,
      CX - 2.55,
      CONDITIONS_Y[0],
      true
    ),

    text(
      'B',
      19, VIOLET,
      CX - 1.97,
      CONDITIONS_Y[0],
      true
    ),

    line(
      CX - 2.41, CONDITIONS_Y[0],
      CX - 2.11, CONDITIONS_Y[0],
      GREEN, 2
    )
  );

  const independentIcon = group(
    pumpIcon(
      CX - 2.62,
      CONDITIONS_Y[1],
      0.42
    ),

    pumpIcon(
      CX - 1.85,
      CONDITIONS_Y[1],
      0.42
    ),

    dashed(
      CX - 2.24,
      CONDITIONS_Y[1] - 0.36,
      CX - 2.24,
      CONDITIONS_Y[1] + 0.36,
      GREEN, 1.5
    )
  );

  const representativeIcon = group(
    pumpIcon(
      CX - 2.65,
      CONDITIONS_Y[2],
      0.37
    ),

    arrow(
      CX - 2.38,
      CONDITIONS_Y[2],
      CX - 2.06,
      CONDITIONS_Y[2],
      GREEN,
      0.08
    ),

    pumpIcon(
      CX - 1.78,
      CONDITIONS_Y[2],
      0.37
    )
  );

  const conditions = [
    conditionPanel(
      0,
      'Same evaluation cases',
      'Keep both tools’ errors paired',
      GREEN,
      pairedIcon
    ),

    conditionPanel(
      1,
      'Independent cases',
      'Resample whole pump observations',
      C.cyan,
      independentIcon
    ),

    conditionPanel(
      2,
      'Representative cases',
      'Comparable to future pumps',
      VIOLET,
      representativeIcon
    )
  ];

  await until(S(52));
  await play(
    ...hideHistogram(),
    ...clear(
      'zero-reference',
      'zero-tag'
    ),
    ...replace('conditions', conditions),
    ...fbox([
      ['paired bootstrap comparison', VIOLET],
      'same cases for both tools',
      'independent observations',
      'representative of future cases'
    ], GREEN),
    ...say('USE INDEPENDENT, REPRESENTATIVE, PAIRED CASES', GREEN)
  );

  // ============================================================
  // 53: MORE BOOTSTRAP ROUNDS ARE NOT MORE REAL OBSERVATIONS
  //
  // The twelve original pumps remain the only real data.
  // Ten thousand bootstrap rounds are repeated calculations
  // made from those twelve observations.
  // ============================================================

  const REAL_Y = P ? 0.69 : 0.72;

  const realPumpIcons = DATA.map((d, i) => {
    const x = CX + (i % 6 - 2.5) * 0.88;
    const y = REAL_Y - Math.floor(i / 6) * 0.70;

    return group(
      rounded(
        x, y,
        0.76, 0.61,
        C.cyan,
        C.card,
        0.95,
        1.3,
        0.06
      ),

      text(
        d.id,
        12, WHITE,
        x - 0.14, y + 0.16,
        true, 0.38
      ),

      pumpIcon(
        x + 0.04,
        y - 0.09,
        0.35
      )
    );
  });

  const realHeading = text(
    '12 REAL OBSERVATIONS',
    21, C.cyan,
    CX,
    REAL_Y + 0.61,
    true, 6.25
  );

  const computationArrow = arrow(
    CX,
    P ? -0.57 : -0.37,
    CX,
    P ? -1.17 : -0.96,
    VIOLET,
    0.17
  );

  const computationalHeading = text(
    '10,000 BOOTSTRAP ROUNDS',
    22, VIOLET,
    CX,
    P ? -1.62 : -1.40,
    true, 6.45
  );

  const noNewData = text(
    'Still only twelve real pumps',
    20, AMBER,
    CX,
    P ? -2.50 : -2.18,
    false, 6.40
  );

  await until(S(53));
  await play(
    ...clear('conditions'),
    ...replace('no-new-data', [
      realHeading,
      ...realPumpIcons,
      computationArrow,
      computationalHeading,
      noNewData
    ]),
    ...fbox([
      ['more bootstrap rounds', VIOLET],
      'make the simulation more stable',
      ['but do not create new data', AMBER],
      'real sample size remains 12'
    ], AMBER),
    ...say('MORE DRAWS DO NOT GIVE US ANY NEW REAL PUMPS', AMBER)
  );

  // ============================================================
  // 54: FINAL RECAP
  //
  // Retain the exact final bootstrap histogram.
  //
  // Observed mean difference = +0.25 hours.
  // Final 95% percentile interval ≈ [-0.667, 1.250].
  //
  // The interval crosses zero.
  //
  // Conclusion:
  // The observed advantage for B may reflect chance variation.
  // These observations do not establish an overall winner.
  // They also do not establish equivalence.
  // ============================================================

  const finalRecapNote = text(
    '12 real pumps · 10,000 bootstrap rounds',
    16, AMBER,
    P ? CX : 4.3,
    P ? -5.38 : -1.76,
    false,
    P ? 6.50 : 4.10
  );

  await until(S(54));
  await play(
    ...clear('no-new-data'),
    ...showHistogramAxes(),
    ...updateHistogram(10000, false),
    ...updateInterval(CI10000),
    ...showObservedMean(),
    ...replace('zero-reference', [zeroReference()]),
    new M.FadeIn(finalRecapNote),
    ...fbox([
      ['PAIRED BOOTSTRAP COMPARISON', VIOLET],
      ['observed mean = +0.25 h', WHITE],
      ['95% interval: −0.67 to +1.25 h', GREEN],
      ['zero inside: no convincing winner', AMBER]
    ], VIOLET),
    ...say('A REAL ADVANTAGE, OR JUST CHANCE?')
  );

  // Hold the completed final histogram until narration ends.

  await until(E(54));
}
