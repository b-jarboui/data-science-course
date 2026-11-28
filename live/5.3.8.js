// lesson 5.3.8
// Monte Carlo error — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter data:
//   True chance of a 30-minute delay = 0.1.
//   Seed 39: 12 late parcels in 100 simulated parcels.
//   Estimated chance = 0.12.
//
// Standard error for independent yes-or-no runs:
//   SE = sqrt(p * (1 - p)) / sqrt(n)
//
// With true p = 0.1:
//   n = 100:   SE = 0.03
//   n = 900:   SE = 0.01
//   n = 10000: SE = 0.003
//
// Estimated SE using p = 0.12:
//   sqrt(0.12 * 0.88 / 100) = approximately 0.032496.
//
// The narration uses the rounded SE of 0.03 to obtain
// the approximate two-SE range [0.06, 0.18].
//
// Parcel grids are arranged by outcome for clear counting.
// Bell curves are normal approximations, not simulated histograms.
// The million-run example illustrates model bias, not a new
// recorded simulation.
//
// Browser rendering has not been tested against the live engine.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data
  // ------------------------------------------------------------

  const SEED = 39;

  const TRUE_P = 0.1;
  const RUNS = 100;
  const LATE_COUNT = 12;
  const NOT_LATE_COUNT = 88;

  const PHAT = LATE_COUNT / RUNS;

  const D = [0, 10, 20, 30];
  const PROB = [0.4, 0.3, 0.2, 0.1];

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const LATE = DC[3];
  const NOT_LATE = C.cyan;
  const TRUE_COLOR = C.green;

  const VAR_SCORE = TRUE_P * (1 - TRUE_P);
  const SD_SCORE = Math.sqrt(VAR_SCORE);

  const monteError = (p, n) =>
    Math.sqrt(p * (1 - p) / n);

  const TRUE_SE100 = monteError(TRUE_P, 100);
  const TRUE_SE900 = monteError(TRUE_P, 900);
  const TRUE_SE10000 = monteError(TRUE_P, 10000);

  const EST_SE = monteError(PHAT, RUNS);
  const ROUND_SE = 0.03;

  const ONE_LOW = PHAT - ROUND_SE;
  const ONE_HIGH = PHAT + ROUND_SE;

  const TWO_LOW = PHAT - 2 * ROUND_SE;
  const TWO_HIGH = PHAT + 2 * ROUND_SE;

  const fmt = v => Number(v.toFixed(4)).toString();

  const commas = n =>
    n.toLocaleString('en-US');

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone:  8 x 14.22, content y = -5.5 to 4.3.
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.50, 0]
    : [4.3, -0.3, 0];

  const MAX_W = P ? FW - 1.2 : 7.1;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false, maxw = MAX_W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function rect(
    w, h, x, y, color,
    opacity = 0.15,
    sw = 2
  ) {
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
    w, h, x, y, color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function outline(
    w, h, x, y,
    color = C.amber
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const r = 0.13;

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),
      line(
        x2, y2,
        x2 - r * Math.cos(a - 0.55),
        y2 - r * Math.sin(a - 0.55),
        color, 2.5
      ),
      line(
        x2, y2,
        x2 - r * Math.cos(a + 0.55),
        y2 - r * Math.sin(a + 0.55),
        color, 2.5
      )
    );
  }

  function glowDot(
    x, y,
    color = C.cyan,
    radius = 0.09,
    opacity = 0.18
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.15,
      color
    });

    halo.setFill(color, opacity);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function tag(
    s, color, x, y,
    size = 17
  ) {
    const p = pill(s, color, size);

    if (p.getWidth() > MAX_W) {
      p.scale(MAX_W / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function cell(
    value, x, y, color,
    w = 1.05,
    h = 0.64
  ) {
    return new M.VGroup(
      rounded(
        w, h, x, y,
        color, color, 0.09
      ),
      txt(
        value,
        P ? 19 : 21,
        color,
        x, y,
        true,
        w - 0.12
      )
    );
  }

  function parcel(
    x, y,
    color,
    size = 0.65
  ) {
    return new M.VGroup(
      rect(
        size,
        size * 0.78,
        x, y,
        color, 0.16
      ),
      rect(
        size * 0.16,
        size * 0.78,
        x, y,
        color, 0.48, 1
      ),
      line(
        x - size / 2,
        y + size * 0.13,
        x + size / 2,
        y + size * 0.13,
        color, 1
      ),
      rect(
        size * 0.22,
        size * 0.16,
        x + size * 0.27,
        y - size * 0.20,
        color, 0.65, 1
      )
    );
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Groups are assembled before entering the scene.
  // Never wrap already visible objects in a new VGroup.
  // Helpers return animations; only beats call play().
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);

    return objects.map(
      o => new M.FadeIn(o)
    );
  }

  function remove(...objects) {
    const present = objects.filter(
      o => visible.includes(o)
    );

    visible = visible.filter(
      o => !present.includes(o)
    );

    return present.map(
      o => new M.FadeOut(o)
    );
  }

  function swap(objects) {
    const old = visible.slice();

    visible = objects.slice();

    return [
      ...old.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function stagger(
    objects,
    runTime = 1.4,
    lagRatio = 0.12
  ) {
    visible.push(...objects);

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved course style
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.35 : 0.42;

    const rows = lines.map(
      l => Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(
      ([s, c]) => T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.36;

    const r = rounded(
      wd, ht,
      BOXP[0], BOXP[1],
      color
    );

    const left = BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.40 : 3.50;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Parcel-grid helpers
  //
  // Exactly 100 objects, of which 12 are late.
  // Late outcomes are grouped together to make counting easy.
  // Their display order is not the original seed-39 draw order.
  // ------------------------------------------------------------

  const GRID_DX = P ? 0.49 : 0.49;
  const GRID_DY = P ? 0.37 : 0.28;

  const GRID_TOP = P ? 0.62 : 0.59;

  const GRID_BOTTOM =
    GRID_TOP - 9 * GRID_DY;

  const SCORES = Array.from(
    { length: RUNS },
    (_, k) => k < LATE_COUNT ? 1 : 0
  );

  function gridPosition(k) {
    return [
      CX + (k % 10 - 4.5) * GRID_DX,
      GRID_TOP - Math.floor(k / 10) * GRID_DY
    ];
  }

  function gridObject(k, mode = 'dot') {
    const score = SCORES[k];
    const color = score ? LATE : NOT_LATE;

    const [x, y] = gridPosition(k);

    if (mode === 'score') {
      return new M.VGroup(
        rounded(
          GRID_DX * 0.83,
          GRID_DY * 0.84,
          x, y,
          color,
          color,
          score ? 0.18 : 0.045
        ),
        txt(
          score,
          P ? 15 : 16,
          color,
          x, y,
          true,
          GRID_DX * 0.65
        )
      );
    }

    if (mode === 'parcel') {
      return parcel(
        x, y,
        color,
        P ? 0.31 : 0.28
      );
    }

    return glowDot(
      x, y,
      color,
      P ? 0.082 : 0.073,
      score ? 0.23 : 0.05
    );
  }

  function gridRows(mode = 'dot') {
    const objects = SCORES.map(
      (_, k) => gridObject(k, mode)
    );

    return Array.from(
      { length: 10 },
      (_, r) =>
        new M.VGroup(
          ...objects.slice(r * 10, r * 10 + 10)
        )
    );
  }

  function gridHeading(s) {
    return txt(
      s,
      P ? 21 : 22,
      C.ink,
      CX,
      GRID_TOP + 0.60,
      true
    );
  }

  function gridCountLegend(
    leftText = '12 late',
    rightText = '88 not late'
  ) {
    const y = GRID_BOTTOM - 0.48;

    return new M.VGroup(
      glowDot(
        CX - 2.03,
        y,
        LATE,
        0.065
      ),
      txt(
        leftText,
        17,
        LATE,
        CX - 1.25,
        y,
        true,
        1.42
      ),
      glowDot(
        CX + 0.25,
        y,
        NOT_LATE,
        0.065
      ),
      txt(
        rightText,
        17,
        NOT_LATE,
        CX + 1.48,
        y,
        true,
        2.22
      )
    );
  }

  // ============================================================
  // 0–1: Recall the Monte Carlo estimate.
  // ============================================================

  const recapRows = gridRows('dot');

  const recapTitle = gridHeading(
    '100 SIMULATED PARCELS'
  );

  const recapLegend = gridCountLegend();

  // 0: Earlier, 100 parcels gave 12 late ones.
  await until(S(0));
  await play(
    ...add(
      recapTitle,
      recapLegend
    ),
    stagger(
      recapRows,
      1.65,
      0.13
    ),
    ...say('100 RUNS. 12 LATE PARCELS.'),
    ...fbox([
      ['seed = 39', C.amber],
      'runs = 100',
      ['late = 12', LATE]
    ])
  );

  // 1: Estimated chance is 0.12.

  const recapEstimate = tag(
    '12 ÷ 100 = 0.12',
    C.green,
    CX,
    P ? -4.32 : -2.67,
    21
  );

  await until(S(1));
  await play(
    ...add(recapEstimate),
    ...say('ESTIMATED CHANCE = 0.12', C.green),
    ...fbox([
      ['12 late parcels', LATE],
      '÷ 100 runs',
      ['= 0.12', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Chance number-line helpers
  // ------------------------------------------------------------

  const AX0 = CX - (P ? 2.88 : 2.96);
  const AX1 = CX + (P ? 2.88 : 2.96);

  const AMIN = 0;
  const AMAX = 0.25;

  const AY = P ? -1.65 : -1.14;

  const ax = v =>
    AX0 +
    (v - AMIN) /
    (AMAX - AMIN) *
    (AX1 - AX0);

  function chanceAxis(
    y = AY,
    title = 'chance'
  ) {
    const parts = [
      line(
        AX0, y,
        AX1, y,
        C.muted, 2.6
      )
    ];

    [0, 0.05, 0.10, 0.15, 0.20, 0.25].forEach(v => {
      parts.push(
        line(
          ax(v), y - 0.075,
          ax(v), y + 0.075,
          C.muted, 1.6
        ),
        txt(
          v.toFixed(2),
          P ? 15 : 16,
          C.muted,
          ax(v),
          y - 0.28,
          true
        )
      );
    });

    if (title) {
      parts.push(
        txt(
          title,
          16,
          C.muted,
          CX,
          y - 0.60
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function chanceMarker(
    value,
    color,
    label,
    y = AY,
    height = 0.65
  ) {
    return new M.VGroup(
      line(
        ax(value), y,
        ax(value), y + height,
        color, 2
      ),
      glowDot(
        ax(value),
        y,
        color,
        0.085
      ),
      txt(
        label,
        P ? 18 : 19,
        color,
        ax(value),
        y + height + 0.25,
        true,
        2.05
      )
    );
  }

  function rangeBracket(
    low, high,
    y,
    color = C.green,
    label = null
  ) {
    const parts = [
      line(
        ax(low), y,
        ax(high), y,
        color, 3.2
      ),
      line(
        ax(low), y - 0.12,
        ax(low), y + 0.12,
        color, 2.5
      ),
      line(
        ax(high), y - 0.12,
        ax(high), y + 0.12,
        color, 2.5
      )
    ];

    if (label) {
      parts.push(
        txt(
          label,
          P ? 19 : 20,
          color,
          (ax(low) + ax(high)) / 2,
          y + 0.28,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ============================================================
  // 2: The manager asks how sure we are.
  // ============================================================

  const managerAxis = chanceAxis();

  const managerEstimate = chanceMarker(
    PHAT,
    C.cyan,
    '0.12',
    AY,
    0.84
  );

  const managerLow = chanceMarker(
    0.05,
    C.amber,
    '0.05?',
    AY,
    0.46
  );

  const managerHigh = chanceMarker(
    0.20,
    C.amber,
    '0.20?',
    AY,
    0.46
  );

  const managerHeading = txt(
    'HOW SURE ARE WE?',
    P ? 28 : 30,
    C.amber,
    CX,
    P ? 0.88 : 0.79,
    true
  );

  await until(S(2));
  await play(
    ...swap([
      managerAxis,
      managerEstimate,
      managerHeading
    ]),
    stagger(
      [managerHigh, managerLow],
      1.65,
      0.40
    ),
    ...say('COULD THE TRUE CHANCE BE DIFFERENT?', C.amber),
    ...fbox([
      ['our estimate = 0.12', C.cyan],
      'could truth be 0.20?',
      'could truth be 0.05?',
      ['how sure are we?', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 3: Monte Carlo error is variation due to chance.
  //
  // Illustrative independent experiments of 100 runs.
  // These three counts demonstrate possible variation.
  // Only the middle experiment is the recorded seed-39 result.
  // ============================================================

  const exampleCounts = [8, 12, 14];

  const EX_Y = P
    ? [0.76, -0.80, -2.36]
    : [0.72, -0.61, -1.94];

  function experimentRow(
    count,
    k
  ) {
    const y = EX_Y[k];

    const width = P ? 5.80 : 6.05;
    const height = P ? 1.10 : 0.94;

    const color =
      k === 1 ? C.cyan : C.violet;

    const parts = [
      rounded(
        width, height,
        CX, y,
        color
      ),
      txt(
        k === 1
          ? 'SEED 39'
          : `EXAMPLE ${k + 1}`,
        P ? 16 : 15,
        C.muted,
        CX - 1.65,
        y + 0.29,
        true,
        2.25
      ),
      txt(
        `${count} / 100`,
        P ? 21 : 22,
        color,
        CX - 1.65,
        y - 0.13,
        true
      ),
      arrow(
        CX - 0.40, y,
        CX + 0.40, y,
        C.muted
      ),
      txt(
        (count / 100).toFixed(2),
        P ? 29 : 30,
        color,
        CX + 1.68,
        y,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const experimentRows =
    exampleCounts.map(experimentRow);

  const experimentNote = txt(
    'Same model · independent runs · different estimates',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -3.55 : -2.74
  );

  await until(S(3));
  await play(
    ...swap([experimentNote]),
    stagger(
      experimentRows,
      1.65,
      0.22
    ),
    ...say('MONTE CARLO ERROR: VARIATION FROM CHANCE', C.violet),
    ...fbox([
      ['Monte Carlo error', C.violet],
      'random variation',
      'between simulations'
    ], C.violet)
  );

  // ============================================================
  // 4: Use the standard error ideas already learned.
  // ============================================================

  await until(S(4));
  await play(
    new M.Indicate(
      experimentRows[1],
      { color: C.amber }
    ),
    ...say('LET US MEASURE THAT ERROR', C.amber),
    ...fbox([
      'we already know',
      ['how means vary', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 5: Turn a parcel into a yes-or-no score.
  // ============================================================

  const SCORE_XS = [
    CX - 1.57,
    CX + 1.57
  ];

  const SCORE_PY = P ? 0.52 : 0.42;
  const SCORE_CY = P ? -1.50 : -1.26;

  function scoreMapping(
    k,
    late
  ) {
    const x = SCORE_XS[k];
    const color = late ? LATE : NOT_LATE;

    return new M.VGroup(
      rounded(
        2.78,
        P ? 3.24 : 2.96,
        x,
        (SCORE_PY + SCORE_CY) / 2,
        color
      ),
      parcel(
        x,
        SCORE_PY,
        color,
        0.72
      ),
      txt(
        late
          ? '30 min late'
          : '0, 10 or 20 min',
        P ? 17 : 18,
        color,
        x,
        SCORE_PY - 0.57,
        true,
        2.48
      ),
      arrow(
        x,
        SCORE_PY - 0.83,
        x,
        SCORE_CY + 0.48,
        C.muted
      ),
      cell(
        late ? '1' : '0',
        x,
        SCORE_CY,
        color,
        0.83,
        0.73
      )
    );
  }

  const lateMapping = scoreMapping(0, true);
  const notLateMapping = scoreMapping(1, false);

  const scoreMapNote = txt(
    'One score for every simulated parcel',
    P ? 19 : 20,
    C.ink,
    CX,
    P ? -3.00 : -2.47
  );

  await until(S(5));
  await play(
    ...swap([scoreMapNote]),
    stagger(
      [lateMapping, notLateMapping],
      1.60,
      0.32
    ),
    ...say('LATE = 1. NOT LATE = 0.', C.violet),
    ...fbox([
      ['late → score 1', LATE],
      ['not late → score 0', NOT_LATE],
      'one score per run'
    ], C.violet)
  );

  // ============================================================
  // 6–7: The share of late parcels is a mean.
  // ============================================================

  const scoreRows = gridRows('score');

  const scoresTitle = gridHeading(
    '100 YES-OR-NO SCORES'
  );

  const scoresLegend = gridCountLegend(
    '12 ones',
    '88 zeros'
  );

  await until(S(6));
  await play(
    ...swap([
      scoresTitle,
      scoresLegend
    ]),
    stagger(
      scoreRows,
      1.65,
      0.13
    ),
    ...say('THE LATE SHARE IS THE MEAN OF THE SCORES'),
    ...fbox([
      'sum of 0–1 scores',
      '÷ number of scores',
      ['= mean score', C.green]
    ], C.green)
  );

  // 7: Twelve ones, 88 zeros, mean 0.12.

  const onesFrame1 = outline(
    GRID_DX * 9.92,
    GRID_DY * 0.98,
    CX,
    GRID_TOP,
    LATE
  );

  const onesFrame2 = outline(
    GRID_DX * 1.92,
    GRID_DY * 0.98,
    CX - 4 * GRID_DX,
    GRID_TOP - GRID_DY,
    LATE
  );

  const scoreSumTag = tag(
    'SUM OF SCORES = 12',
    LATE,
    CX,
    P ? -4.15 : -3.10,
    18
  );

  await until(S(7));
  await play(
    ...add(
      onesFrame1,
      onesFrame2,
      scoreSumTag
    ),
    ...say('12 ONES + 88 ZEROS'),
    ...fbox([
      ['12 × 1 = 12', LATE],
      ['88 × 0 = 0', NOT_LATE],
      'sum of scores = 12'
    ])
  );

  await until(S(7) + 3.3);

  const scoreMeanTag = tag(
    'MEAN SCORE = 0.12',
    C.green,
    CX,
    P ? -4.15 : -3.10,
    20
  );

  await play(
    ...remove(scoreSumTag),
    ...add(scoreMeanTag),
    ...say('12 ÷ 100 = 0.12', C.green),
    ...fbox([
      'mean score',
      '  = (12 + 0) ÷ 100',
      ['  = 0.12', C.green],
      'same as late share'
    ], C.green)
  );

  // ============================================================
  // 8: An estimated chance is a mean.
  // Therefore it has a standard error.
  // ============================================================

  const meanConnectionY = P ? -0.40 : -0.43;

  const probabilityCard = new M.VGroup(
    rounded(
      2.68,
      1.65,
      CX - 1.56,
      meanConnectionY,
      C.cyan
    ),
    txt(
      'ESTIMATED CHANCE',
      16,
      C.cyan,
      CX - 1.56,
      meanConnectionY + 0.48,
      true,
      2.42
    ),
    txt(
      '0.12',
      37,
      C.cyan,
      CX - 1.56,
      meanConnectionY - 0.12,
      true
    )
  );

  const meanCard = new M.VGroup(
    rounded(
      2.68,
      1.65,
      CX + 1.56,
      meanConnectionY,
      C.green
    ),
    txt(
      'MEAN OF SCORES',
      16,
      C.green,
      CX + 1.56,
      meanConnectionY + 0.48,
      true,
      2.42
    ),
    txt(
      '0.12',
      37,
      C.green,
      CX + 1.56,
      meanConnectionY - 0.12,
      true
    )
  );

  const meanEquals = txt(
    '=',
    29,
    C.ink,
    CX,
    meanConnectionY,
    true
  );

  const connectionNote = tag(
    'A MEAN HAS A STANDARD ERROR',
    C.violet,
    CX,
    P ? -2.42 : -2.18,
    18
  );

  await until(S(8));
  await play(
    ...swap([
      probabilityCard,
      meanCard,
      meanEquals,
      connectionNote
    ]),
    ...say('OUR ESTIMATE IS A MEAN', C.green),
    ...fbox([
      'estimated chance = mean',
      ['spread of means = SE', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // Formula helpers
  // ------------------------------------------------------------

  function fraction(
    numerator,
    denominator,
    y,
    options = {}
  ) {
    const {
      left = 'SE =',
      color = C.green,
      numeratorColor = C.amber,
      denominatorColor = C.violet,
      width = 3.85,
      size = P ? 25 : 27
    } = options;

    const fractionCX = CX + 0.68;

    return new M.VGroup(
      txt(
        left,
        P ? 31 : 33,
        color,
        CX - 2.23,
        y,
        true,
        1.55
      ),
      txt(
        numerator,
        size,
        numeratorColor,
        fractionCX,
        y + 0.46,
        true,
        width - 0.10
      ),
      line(
        fractionCX - width / 2,
        y,
        fractionCX + width / 2,
        y,
        C.ink, 2.8
      ),
      txt(
        denominator,
        size,
        denominatorColor,
        fractionCX,
        y - 0.46,
        true,
        width - 0.10
      )
    );
  }

  // ============================================================
  // 9: Recall the standard error rule.
  // ============================================================

  const recallFormula = fraction(
    'single-value SD',
    '√number of values',
    P ? -0.35 : -0.39,
    { size: P ? 23 : 24 }
  );

  const recallFormulaFrame = outline(
    P ? 6.02 : 6.15,
    1.96,
    CX,
    P ? -0.35 : -0.39,
    C.violet
  );

  const recallFormulaHeading = txt(
    'THE STANDARD ERROR RULE',
    P ? 22 : 23,
    C.violet,
    CX,
    P ? 1.25 : 1.10,
    true
  );

  await until(S(9));
  await play(
    ...swap([
      recallFormulaHeading,
      recallFormulaFrame,
      recallFormula
    ]),
    ...say('SE = SINGLE-VALUE SPREAD ÷ √n', C.violet),
    ...fbox([
      ['SE = SD / √n', C.green],
      'from the previous lessons'
    ], C.violet)
  );

  // ============================================================
  // 10: Here, the values are independent simulation runs.
  // ============================================================

  const runMeaningY = P ? -2.55 : -2.03;

  const runMeaning = new M.VGroup(
    rounded(
      P ? 5.90 : 6.10,
      P ? 1.10 : 0.89,
      CX,
      runMeaningY,
      C.cyan
    ),
    txt(
      'HERE: ONE VALUE = ONE RUN',
      P ? 18 : 19,
      C.cyan,
      CX,
      runMeaningY + 0.20,
      true
    ),
    txt(
      'A score of either zero or one',
      17,
      C.ink,
      CX,
      runMeaningY - 0.23
    )
  );

  await until(S(10));
  await play(
    ...add(runMeaning),
    ...say('WE NEED THE SPREAD OF ONE SCORE'),
    ...fbox([
      'need two things:',
      ['SD of a single score', C.amber],
      ['number of runs', C.violet]
    ])
  );

  // ============================================================
  // 11: The probability distribution of one score.
  //
  // Score 0 occurs with probability 0.9.
  // Score 1 occurs with probability 0.1.
  // ============================================================

  const SCORE_BASE = P ? -2.90 : -1.72;

  const SCORE_HEIGHT = P ? 3.20 : 2.32;

  const SCORE_X0 = CX - 1.72;
  const SCORE_X1 = CX + 1.72;

  function scoreX(v) {
    return SCORE_X0 +
      v * (SCORE_X1 - SCORE_X0);
  }

  const scoreAxis = new M.VGroup(
    line(
      SCORE_X0 - 0.80,
      SCORE_BASE,
      SCORE_X1 + 0.80,
      SCORE_BASE,
      C.muted, 2.5
    ),
    txt(
      '0',
      22,
      NOT_LATE,
      SCORE_X0,
      SCORE_BASE - 0.32,
      true
    ),
    txt(
      '1',
      22,
      LATE,
      SCORE_X1,
      SCORE_BASE - 0.32,
      true
    ),
    txt(
      'score',
      16,
      C.muted,
      CX,
      SCORE_BASE - 0.66
    )
  );

  const binaryBars = [
    [0, 0.9, NOT_LATE],
    [1, 0.1, LATE]
  ].map(([score, chance, color]) => {
    const h = SCORE_HEIGHT * chance / 0.9;

    const x = scoreX(score);

    return new M.VGroup(
      rect(
        1.06,
        h,
        x,
        SCORE_BASE + h / 2,
        color, 0.76
      ),
      txt(
        chance.toFixed(1),
        25,
        color,
        x,
        SCORE_BASE + h + 0.25,
        true
      )
    );
  });

  const binaryTitle = txt(
    'ONE YES-OR-NO SCORE',
    P ? 22 : 23,
    C.ink,
    CX,
    P ? 1.35 : 1.20,
    true
  );

  await until(S(11));
  await play(
    ...swap([
      scoreAxis,
      binaryTitle
    ]),
    stagger(
      binaryBars,
      1.45,
      0.30
    ),
    ...say('SCORE 0: CHANCE 0.9. SCORE 1: CHANCE 0.1.'),
    ...fbox([
      ['score 0: chance 0.9', NOT_LATE],
      ['score 1: chance 0.1', LATE],
      'mean score = 0.1'
    ])
  );

  // ============================================================
  // 12–13: Variance of a yes-or-no score.
  //
  // Score mean = p = 0.1.
  // Squared distances:
  //   Score 0: (0 - 0.1)^2 = 0.01
  //   Score 1: (1 - 0.1)^2 = 0.81
  //
  // Weighted sum:
  //   0.9 * 0.01 + 0.1 * 0.81 = 0.09
  // ============================================================

  const DISTANCE_Y = P ? -1.07 : -0.82;

  const scoreMeanX = scoreX(TRUE_P);

  const scoreDistanceAxis = new M.VGroup(
    line(
      SCORE_X0 - 0.35,
      DISTANCE_Y,
      SCORE_X1 + 0.35,
      DISTANCE_Y,
      C.muted, 2.5
    ),
    glowDot(
      SCORE_X0,
      DISTANCE_Y,
      NOT_LATE,
      0.11
    ),
    glowDot(
      SCORE_X1,
      DISTANCE_Y,
      LATE,
      0.11
    ),
    txt(
      '0',
      23,
      NOT_LATE,
      SCORE_X0,
      DISTANCE_Y - 0.40,
      true
    ),
    txt(
      '1',
      23,
      LATE,
      SCORE_X1,
      DISTANCE_Y - 0.40,
      true
    )
  );

  const scoreMeanMarker = new M.VGroup(
    dashed(
      scoreMeanX,
      DISTANCE_Y - 0.13,
      scoreMeanX,
      DISTANCE_Y + 0.94,
      C.green
    ),
    glowDot(
      scoreMeanX,
      DISTANCE_Y,
      C.green,
      0.072
    ),
    txt(
      'MEAN = 0.1',
      18,
      C.green,
      scoreMeanX + 0.18,
      DISTANCE_Y + 1.19,
      true
    )
  );

  const nearDistance = new M.VGroup(
    line(
      SCORE_X0,
      DISTANCE_Y + 0.35,
      scoreMeanX,
      DISTANCE_Y + 0.35,
      NOT_LATE, 3.0
    ),
    txt(
      '0.1',
      17,
      NOT_LATE,
      SCORE_X0 - 0.42,
      DISTANCE_Y + 0.38,
      true
    )
  );

  const farDistance = new M.VGroup(
    line(
      scoreMeanX,
      DISTANCE_Y + 0.35,
      SCORE_X1,
      DISTANCE_Y + 0.35,
      LATE, 3.0
    ),
    txt(
      '0.9',
      19,
      LATE,
      (scoreMeanX + SCORE_X1) / 2,
      DISTANCE_Y + 0.61,
      true
    )
  );

  const varianceReminder = txt(
    'Average the squared distances',
    P ? 20 : 21,
    C.amber,
    CX,
    P ? -2.70 : -2.17
  );

  // 12: Variance is the average squared distance.
  await until(S(12));
  await play(
    ...swap([
      scoreDistanceAxis,
      scoreMeanMarker,
      nearDistance,
      farDistance,
      varianceReminder
    ]),
    ...say('VARIANCE = AVERAGE SQUARED DISTANCE', C.amber),
    ...fbox([
      'distance from mean',
      'square each distance',
      ['average the squares', C.amber]
    ], C.amber)
  );

  // 13: For binary scores, variance = p(1 - p).

  const VAR_Y = P ? -0.34 : -0.45;

  const varianceCard = new M.VGroup(
    rounded(
      P ? 5.80 : 6.05,
      P ? 2.74 : 2.53,
      CX,
      VAR_Y,
      C.violet
    ),
    txt(
      'FOR SCORES OF ZERO OR ONE',
      P ? 19 : 20,
      C.violet,
      CX,
      VAR_Y + 0.92,
      true
    ),
    txt(
      'Variance',
      P ? 25 : 27,
      C.ink,
      CX,
      VAR_Y + 0.27
    ),
    txt(
      '= p × (1 − p)',
      P ? 35 : 36,
      C.amber,
      CX,
      VAR_Y - 0.42,
      true
    ),
    txt(
      'p = chance of score 1',
      17,
      C.muted,
      CX,
      VAR_Y - 1.01
    )
  );

  await until(S(13));
  await play(
    ...swap([varianceCard]),
    ...say('BINARY VARIANCE = CHANCE × ONE MINUS CHANCE', C.violet),
    ...fbox([
      ['variance = p(1 − p)', C.amber],
      'for yes-or-no scores'
    ], C.violet)
  );

  // ============================================================
  // 14: Substitute 0.1 and 0.9.
  // ============================================================

  const multiplyY = P ? -0.37 : -0.43;

  const probabilityFactors = new M.VGroup(
    cell(
      '0.1',
      CX - 1.94,
      multiplyY + 0.54,
      LATE,
      1.30,
      0.86
    ),
    txt(
      '×',
      31,
      C.muted,
      CX - 0.96,
      multiplyY + 0.54,
      true
    ),
    cell(
      '0.9',
      CX,
      multiplyY + 0.54,
      NOT_LATE,
      1.30,
      0.86
    ),
    txt(
      '=',
      31,
      C.muted,
      CX + 0.96,
      multiplyY + 0.54,
      true
    ),
    cell(
      '0.09',
      CX + 1.94,
      multiplyY + 0.54,
      C.amber,
      1.30,
      0.86
    )
  );

  const factorLabels = [
    txt(
      'p',
      20,
      LATE,
      CX - 1.94,
      multiplyY - 0.14,
      true
    ),
    txt(
      '1 − p',
      20,
      NOT_LATE,
      CX,
      multiplyY - 0.14,
      true
    ),
    txt(
      'variance',
      17,
      C.amber,
      CX + 1.94,
      multiplyY - 0.14,
      true
    )
  ];

  const varianceResult = tag(
    'VARIANCE = 0.09',
    C.amber,
    CX,
    P ? -2.44 : -2.06,
    21
  );

  await until(S(14));
  await play(
    ...swap([
      probabilityFactors,
      ...factorLabels,
      varianceResult
    ]),
    ...say('0.1 × 0.9 = 0.09', C.amber),
    ...fbox([
      'variance = p(1 − p)',
      '         = 0.1 × 0.9',
      ['         = 0.09', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 15: Square root of variance gives single-score SD.
  //
  // Show a square whose area is 0.09 and side length is 0.3.
  // ============================================================

  const ROOT_Y = P ? -0.57 : -0.45;
  const ROOT_SIDE = P ? 2.18 : 1.90;

  const rootSquare = rect(
    ROOT_SIDE,
    ROOT_SIDE,
    CX,
    ROOT_Y,
    C.amber,
    0.24,
    2.5
  );

  const rootArea = txt(
    '0.09',
    35,
    C.amber,
    CX,
    ROOT_Y,
    true
  );

  const rootSideTop = txt(
    '0.3',
    23,
    C.violet,
    CX,
    ROOT_Y + ROOT_SIDE / 2 + 0.29,
    true
  );

  const rootSideLeft = txt(
    '0.3',
    23,
    C.violet,
    CX - ROOT_SIDE / 2 - 0.40,
    ROOT_Y,
    true
  );

  const rootEquation = tag(
    '√0.09 = 0.3',
    C.green,
    CX,
    P ? -2.72 : -2.18,
    23
  );

  await until(S(15));
  await play(
    ...swap([
      rootSquare,
      rootArea,
      rootSideTop,
      rootSideLeft
    ]),
    ...say('TAKE THE SQUARE ROOT OF THE VARIANCE', C.violet),
    ...fbox([
      'variance = 0.09',
      '0.3 × 0.3 = 0.09',
      ['SD = √0.09', C.violet]
    ], C.violet)
  );

  await until(S(15) + 2.8);
  await play(
    ...add(rootEquation),
    ...say('SINGLE-SCORE SD = 0.3', C.green),
    ...fbox([
      ['SD = 0.3', C.green],
      'spread of one score'
    ], C.green)
  );

  // ============================================================
  // 16: Divide by the square root of the number of runs.
  // ============================================================

  const mainDivide = fraction(
    '0.3',
    '√runs',
    P ? -0.35 : -0.39,
    {
      size: 35,
      width: 3.55
    }
  );

  const divideHeading = txt(
    'NOW FIND THE ERROR OF THE MEAN',
    P ? 21 : 22,
    C.violet,
    CX,
    P ? 1.25 : 1.13,
    true
  );

  const divideFrame = outline(
    P ? 5.85 : 6.05,
    1.99,
    CX,
    P ? -0.35 : -0.39,
    C.violet
  );

  await until(S(16));
  await play(
    ...swap([
      divideHeading,
      divideFrame,
      mainDivide
    ]),
    ...say('DIVIDE 0.3 BY √RUNS', C.green),
    ...fbox([
      ['SD of one score = 0.3', C.amber],
      ['SE = 0.3 / √runs', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Error comparison helpers
  //
  // Each row shows the one-standard-error spread around p = 0.1.
  // All rows use exactly the same chance scale.
  // ------------------------------------------------------------

  const ERR_X0 = CX - 1.62;
  const ERR_X1 = CX + 2.88;

  const ERR_MIN = 0.06;
  const ERR_MAX = 0.14;

  const ex = v =>
    ERR_X0 +
    (v - ERR_MIN) /
    (ERR_MAX - ERR_MIN) *
    (ERR_X1 - ERR_X0);

  const ERROR_YS = P
    ? [0.68, -1.02, -2.72]
    : [0.64, -0.72, -2.08];

  const ERROR_CASES = [
    {
      n: 100,
      root: 10,
      error: TRUE_SE100,
      color: C.cyan
    },
    {
      n: 900,
      root: 30,
      error: TRUE_SE900,
      color: C.violet
    },
    {
      n: 10000,
      root: 100,
      error: TRUE_SE10000,
      color: C.green
    }
  ];

  function errorRow(item, k) {
    const { n, error, color } = item;

    const y = ERROR_YS[k];

    const lo = TRUE_P - error;
    const hi = TRUE_P + error;

    const labelX = CX - 2.32;

    return new M.VGroup(
      txt(
        `${commas(n)} runs`,
        P ? 18 : 18,
        color,
        labelX,
        y + 0.18,
        true,
        1.95
      ),
      txt(
        `SE ${fmt(error)}`,
        P ? 18 : 17,
        C.amber,
        labelX,
        y - 0.21,
        true,
        1.95
      ),
      line(
        ERR_X0, y,
        ERR_X1, y,
        C.muted, 1.7
      ),
      rect(
        ex(hi) - ex(lo),
        P ? 0.43 : 0.34,
        ex(TRUE_P),
        y,
        color,
        0.23,
        1.2
      ),
      line(
        ex(lo), y,
        ex(hi), y,
        color, 4
      ),
      line(
        ex(lo), y - 0.15,
        ex(lo), y + 0.15,
        color, 2.4
      ),
      line(
        ex(hi), y - 0.15,
        ex(hi), y + 0.15,
        color, 2.4
      ),
      glowDot(
        ex(TRUE_P),
        y,
        C.green,
        0.073
      )
    );
  }

  const errorRows = ERROR_CASES.map(errorRow);

  const errorTruthLine = dashed(
    ex(TRUE_P),
    ERROR_YS[2] - 0.29,
    ex(TRUE_P),
    ERROR_YS[0] + 0.43,
    C.green
  );

  const errorTruthLabel = txt(
    'TRUE CHANCE 0.1',
    P ? 18 : 16,
    C.green,
    ex(TRUE_P),
    ERROR_YS[0] + 0.69,
    true
  );

  const errorAxisLabels = [
    0.06, 0.08, 0.10, 0.12, 0.14
  ].map(v =>
    txt(
      v.toFixed(2),
      P ? 16 : 15,
      v === 0.1 ? C.green : C.muted,
      ex(v),
      ERROR_YS[2] - 0.44,
      true
    )
  );

  const errorComparisonNote = txt(
    'Each bar shows one SE on either side of 0.1',
    14,
    C.muted,
    CX,
    P ? -4.10 : -2.83
  );

  // ============================================================
  // 17–19: Calculate the error for three run counts.
  // ============================================================

  // 17: 100 runs give SE = 0.03.
  await until(S(17));
  await play(
    ...swap([
      errorTruthLine,
      errorTruthLabel,
      errorRows[0],
      ...errorAxisLabels
    ]),
    ...say('100 RUNS: ERROR = 0.03', C.cyan),
    ...fbox([
      'runs = 100',
      '√100 = 10',
      'SE = 0.3 ÷ 10',
      ['   = 0.03', C.cyan]
    ], C.cyan)
  );

  // 18: 900 runs give SE = 0.01.
  await until(S(18));
  await play(
    ...add(errorRows[1]),
    ...say('900 RUNS: ERROR = 0.01', C.violet),
    ...fbox([
      'runs = 900',
      '√900 = 30',
      'SE = 0.3 ÷ 30',
      ['   = 0.01', C.violet]
    ], C.violet)
  );

  // 19: 10,000 runs give SE = 0.003.
  await until(S(19));
  await play(
    ...add(
      errorRows[2],
      errorComparisonNote
    ),
    ...say('10,000 RUNS: ERROR = 0.003', C.green),
    ...fbox([
      'runs = 10,000',
      '√10,000 = 100',
      'SE = 0.3 ÷ 100',
      ['   = 0.003', C.green]
    ], C.green)
  );

  // ============================================================
  // 20: In real life the true chance is unknown.
  // Use the estimate in its place.
  // ============================================================

  const substitutionY = P ? -0.40 : -0.43;

  const unknownCard = new M.VGroup(
    rounded(
      2.72,
      2.05,
      CX - 1.57,
      substitutionY,
      C.amber
    ),
    txt(
      'TRUE CHANCE',
      17,
      C.muted,
      CX - 1.57,
      substitutionY + 0.60,
      true,
      2.46
    ),
    txt(
      '?',
      48,
      C.amber,
      CX - 1.57,
      substitutionY - 0.02,
      true
    ),
    txt(
      'unknown',
      16,
      C.amber,
      CX - 1.57,
      substitutionY - 0.66
    )
  );

  const estimateCard = new M.VGroup(
    rounded(
      2.72,
      2.05,
      CX + 1.57,
      substitutionY,
      C.cyan
    ),
    txt(
      'ESTIMATED CHANCE',
      16,
      C.muted,
      CX + 1.57,
      substitutionY + 0.60,
      true,
      2.46
    ),
    txt(
      '0.12',
      39,
      C.cyan,
      CX + 1.57,
      substitutionY - 0.02,
      true
    ),
    txt(
      'available',
      16,
      C.cyan,
      CX + 1.57,
      substitutionY - 0.66
    )
  );

  const substituteArrow = arrow(
    CX + 0.19,
    substitutionY,
    CX - 0.19,
    substitutionY,
    C.green
  );

  const substitutionNote = tag(
    'USE THE ESTIMATE IN PLACE OF p',
    C.green,
    CX,
    P ? -2.58 : -2.20,
    17
  );

  await until(S(20));
  await play(
    ...swap([
      unknownCard,
      estimateCard,
      substituteArrow,
      substitutionNote
    ]),
    ...say('UNKNOWN TRUE CHANCE? USE OUR ESTIMATE.', C.green),
    ...fbox([
      'true p is unknown',
      ['use estimate = 0.12', C.cyan],
      'to estimate the SE'
    ], C.green)
  );

  // ============================================================
  // 21: Substitute 0.12, 0.88 and 100.
  // ============================================================

  const EST_FORM_Y = P ? -0.45 : -0.45;

  const estimateFormulaHeading = txt(
    'ESTIMATE THE MONTE CARLO ERROR',
    P ? 21 : 22,
    C.violet,
    CX,
    P ? 1.30 : 1.15,
    true
  );

  const estimateFormula = fraction(
    '√(0.12 × 0.88)',
    '√100',
    EST_FORM_Y,
    {
      left: 'SE ≈',
      size: P ? 26 : 27,
      width: 3.95
    }
  );

  const estimateFormulaFrame = outline(
    P ? 6.05 : 6.20,
    1.98,
    CX,
    EST_FORM_Y,
    C.violet
  );

  const equivalentExpression = txt(
    '= √(0.12 × 0.88 ÷ 100)',
    P ? 23 : 24,
    C.ink,
    CX,
    P ? -2.55 : -2.10,
    true
  );

  await until(S(21));
  await play(
    ...swap([
      estimateFormulaHeading,
      estimateFormulaFrame,
      estimateFormula
    ]),
    ...say('USE p = 0.12 AND 1 − p = 0.88', C.violet),
    ...fbox([
      ['p ≈ 0.12', C.cyan],
      '1 − p ≈ 0.88',
      'runs = 100'
    ], C.violet)
  );

  await until(S(21) + 3.5);
  await play(
    ...add(equivalentExpression),
    ...fbox([
      'SE ≈ √(0.12 × 0.88',
      '          ÷ 100)',
      '   = √0.001056'
    ], C.violet)
  );

  // ============================================================
  // 22: Estimated SE ≈ 0.032, about 0.03.
  // ============================================================

  const estimatedSECard = new M.VGroup(
    rounded(
      P ? 5.70 : 5.95,
      2.35,
      CX,
      P ? -0.40 : -0.44,
      C.green
    ),
    txt(
      'ESTIMATED STANDARD ERROR',
      19,
      C.muted,
      CX,
      P ? 0.34 : 0.30,
      true
    ),
    txt(
      '0.0325...',
      P ? 35 : 37,
      C.cyan,
      CX,
      P ? -0.25 : -0.29,
      true
    ),
    txt(
      '≈ 0.03',
      P ? 34 : 36,
      C.green,
      CX,
      P ? -0.99 : -1.03,
      true
    )
  );

  const sameSizeTag = tag(
    'ABOUT THE SAME AS BEFORE',
    C.green,
    CX,
    P ? -2.51 : -2.18,
    18
  );

  await until(S(22));
  await play(
    ...swap([
      estimatedSECard,
      sameSizeTag
    ]),
    ...say('ESTIMATED ERROR ≈ 0.03', C.green),
    ...fbox([
      `SE ≈ ${EST_SE.toFixed(4)}`,
      ['about 0.03', C.green],
      'same size as before'
    ], C.green)
  );

  // ------------------------------------------------------------
  // Bell-curve helpers
  //
  // The curve describes approximate sampling variation.
  // It is not a probability distribution for the fixed true p.
  // ------------------------------------------------------------

  const BBASE = P ? -2.55 : -1.68;
  const BHEIGHT = P ? 3.05 : 2.18;

  function bellY(v, center = PHAT, sd = ROUND_SE) {
    return BBASE +
      BHEIGHT *
      Math.exp(
        -0.5 * ((v - center) / sd) ** 2
      );
  }

  function bellCurve(
    center = PHAT,
    sd = ROUND_SE,
    color = C.violet,
    base = BBASE,
    height = BHEIGHT,
    xx = ax,
    min = AMIN,
    max = AMAX
  ) {
    const parts = [];
    const steps = 120;

    const yy = v =>
      base +
      height *
      Math.exp(
        -0.5 * ((v - center) / sd) ** 2
      );

    for (let k = 0; k < steps; k++) {
      const a =
        min + (max - min) * k / steps;

      const b =
        min + (max - min) * (k + 1) / steps;

      parts.push(
        line(
          xx(a), yy(a),
          xx(b), yy(b),
          color,
          3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bellFill(
    from,
    to,
    color,
    opacity = 0.28,
    center = PHAT,
    sd = ROUND_SE
  ) {
    const parts = [];
    const steps = 140;

    const dx = (AMAX - AMIN) / steps;

    for (let k = 0; k < steps; k++) {
      const lo = AMIN + k * dx;
      const hi = lo + dx;

      const a = Math.max(lo, from);
      const b = Math.min(hi, to);

      if (b <= a) continue;

      const v = (a + b) / 2;

      const h =
        BHEIGHT *
        Math.exp(
          -0.5 * ((v - center) / sd) ** 2
        );

      if (h < 0.001) continue;

      parts.push(
        rect(
          ax(b) - ax(a) + 0.001,
          h,
          (ax(a) + ax(b)) / 2,
          BBASE + h / 2,
          color,
          opacity,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function bellCenter(
    value = PHAT,
    color = C.cyan
  ) {
    return new M.VGroup(
      dashed(
        ax(value),
        BBASE,
        ax(value),
        bellY(value) + 0.14,
        color
      ),
      glowDot(
        ax(value),
        BBASE,
        color,
        0.083
      )
    );
  }

  function bellBoundary(
    value,
    color = C.amber
  ) {
    return dashed(
      ax(value),
      BBASE,
      ax(value),
      bellY(value) + 0.22,
      color
    );
  }

  function uncertaintyHeading(s) {
    return txt(
      s,
      P ? 21 : 22,
      C.violet,
      CX,
      P ? 1.40 : 1.24,
      true
    );
  }

  // ============================================================
  // 23: Report 0.12, give or take about 0.03.
  // ============================================================

  const oneSEFill = bellFill(
    ONE_LOW,
    ONE_HIGH,
    C.cyan,
    0.31
  );

  const uncertaintyAxis = chanceAxis(
    BBASE,
    P ? 'chance' : ''
  );

  const uncertaintyBell = bellCurve();

  const uncertaintyCenter = bellCenter();

  const uncertaintyTitle = uncertaintyHeading(
    'ESTIMATE AND ITS UNCERTAINTY'
  );

  const oneSEBoundaries = [
    bellBoundary(ONE_LOW, C.cyan),
    bellBoundary(ONE_HIGH, C.cyan)
  ];

  const uncertaintyEstimate = tag(
    '0.12 ± 0.03',
    C.cyan,
    ax(PHAT),
    BBASE + BHEIGHT * 0.57,
    22
  );

  const oneSELabels = [
    txt(
      '0.09',
      17,
      C.cyan,
      ax(ONE_LOW),
      BBASE + 0.31,
      true
    ),
    txt(
      '0.15',
      17,
      C.cyan,
      ax(ONE_HIGH),
      BBASE + 0.31,
      true
    )
  ];

  const uncertaintyNote = txt(
    'One SE describes a typical sampling error',
    15,
    C.muted,
    CX,
    P ? -3.90 : -2.64
  );

  await until(S(23));
  await play(
    ...swap([
      oneSEFill,
      uncertaintyAxis,
      uncertaintyBell,
      uncertaintyCenter,
      uncertaintyTitle,
      ...oneSEBoundaries,
      ...oneSELabels,
      uncertaintyEstimate,
      uncertaintyNote
    ]),
    ...say('0.12, GIVE OR TAKE ABOUT 0.03', C.cyan),
    ...fbox([
      ['estimate = 0.12', C.cyan],
      ['SE ≈ 0.03', C.amber],
      ['report: 0.12 ± 0.03', C.green],
      'a typical error'
    ], C.green)
  );

  // ============================================================
  // 24: Use two standard errors each way.
  //
  // Using the rounded SE:
  // 0.12 - 0.06 = 0.06
  // 0.12 + 0.06 = 0.18
  // ============================================================

  const twoSEFill = bellFill(
    TWO_LOW,
    TWO_HIGH,
    C.green,
    0.37
  );

  const twoSEBell = bellCurve();

  const twoSEAxis = chanceAxis(
    BBASE,
    P ? 'chance' : ''
  );

  const twoSECenter = bellCenter();

  const twoSEHeading = uncertaintyHeading(
    'TWO STANDARD ERRORS EACH WAY'
  );

  const twoSEBoundaries = [
    bellBoundary(TWO_LOW, C.green),
    bellBoundary(TWO_HIGH, C.green)
  ];

  const twoSELabel = txt(
    '≈ 95%',
    P ? 36 : 37,
    C.green,
    ax(PHAT),
    BBASE + BHEIGHT * 0.56,
    true
  );

  const twoSESub = txt(
    'normal-rule approximation',
    P ? 17 : 16,
    C.muted,
    CX,
    P ? -4.40 : -3.15
  );

  const twoSEBracketY =
    P ? -3.80 : -2.50;

  const twoSEBracket = rangeBracket(
    TWO_LOW,
    TWO_HIGH,
    twoSEBracketY,
    C.green
  );

  const twoSEEndLabels = [
    txt(
      '0.06',
      20,
      C.green,
      ax(TWO_LOW),
      twoSEBracketY - 0.30,
      true
    ),
    txt(
      '0.18',
      20,
      C.green,
      ax(TWO_HIGH),
      twoSEBracketY - 0.30,
      true
    )
  ];

  await until(S(24));
  await play(
    ...swap([
      twoSEFill,
      twoSEAxis,
      twoSEBell,
      twoSECenter,
      twoSEHeading,
      ...twoSEBoundaries,
      twoSELabel,
      twoSESub,
      twoSEBracket,
      ...twoSEEndLabels
    ]),
    ...say('TWO ERRORS EACH WAY: 0.06 TO 0.18', C.green),
    ...fbox([
      '2 × 0.03 = 0.06',
      '0.12 − 0.06 = 0.06',
      '0.12 + 0.06 = 0.18',
      ['rough range: [0.06, 0.18]', C.green]
    ], C.green)
  );

  // ============================================================
  // 25: The true model value lies in this approximate range.
  // ============================================================

  const truthMarker = new M.VGroup(
    glowDot(
      ax(TRUE_P),
      BBASE,
      C.green,
      0.105
    ),
    line(
      ax(TRUE_P),
      BBASE - 0.05,
      ax(TRUE_P),
      BBASE + 0.80,
      C.green,
      2.6
    ),
    tag(
      'TRUE 0.10',
      C.green,
      ax(TRUE_P),
      BBASE + 1.05,
      16
    )
  );

  await until(S(25));
  await play(
    ...remove(twoSESub),
    ...add(truthMarker),
    ...say('THE RANGE CONTAINS THE TRUE VALUE', C.green),
    ...fbox([
      'range: 0.06 to 0.18',
      ['true value = 0.10', C.green],
      'inside the range'
    ], C.green)
  );

  // ============================================================
  // 26: Answer the manager.
  //
  // The two suggested values lie outside the rough range.
  // They are less consistent with the observed result under
  // the normal approximation, not logically impossible.
  // ============================================================

  const answerAxisY = P ? -1.70 : -1.30;

  const managerAnswerAxis = chanceAxis(
    answerAxisY,
    'possible chance'
  );

  const answerBand = rect(
    ax(TWO_HIGH) - ax(TWO_LOW),
    0.38,
    (ax(TWO_LOW) + ax(TWO_HIGH)) / 2,
    answerAxisY,
    C.green,
    0.25,
    1.5
  );

  const answerRange = rangeBracket(
    TWO_LOW,
    TWO_HIGH,
    answerAxisY + 0.57,
    C.green,
    '0.06 to 0.18'
  );

  const answerEstimateDot = glowDot(
    ax(PHAT),
    answerAxisY,
    C.cyan,
    0.10
  );

  const answerTrueDot = glowDot(
    ax(TRUE_P),
    answerAxisY,
    C.green,
    0.085
  );

  const answerEstimateLabel = txt(
    'estimate 0.12',
    17,
    C.cyan,
    ax(PHAT) + 0.20,
    answerAxisY - 1.03,
    true
  );

  function excludedValue(v, label) {
    const x = ax(v);

    return new M.VGroup(
      glowDot(
        x,
        answerAxisY,
        LATE,
        0.09
      ),
      line(
        x,
        answerAxisY + 0.12,
        x,
        answerAxisY + 1.23,
        LATE,
        2
      ),
      txt(
        label,
        P ? 18 : 19,
        LATE,
        x,
        answerAxisY + 1.47,
        true
      ),
      txt(
        'outside',
        15,
        LATE,
        x,
        answerAxisY + 1.79
      )
    );
  }

  const excludedLow = excludedValue(
    0.05,
    '0.05'
  );

  const excludedHigh = excludedValue(
    0.20,
    '0.20'
  );

  const managerConclusion = txt(
    'Less plausible under this approximate rule',
    P ? 18 : 19,
    C.amber,
    CX,
    P ? -3.45 : -2.77
  );

  await until(S(26));
  await play(
    ...swap([
      answerBand,
      managerAnswerAxis,
      answerRange,
      answerEstimateDot,
      answerTrueDot,
      answerEstimateLabel
    ]),
    stagger(
      [excludedHigh, excludedLow],
      1.5,
      0.35
    ),
    ...add(managerConclusion),
    ...say('0.20 AND 0.05 ARE BOTH OUTSIDE THE RANGE', C.amber),
    ...fbox([
      ['0.05 < 0.06', LATE],
      ['0.20 > 0.18', LATE],
      'less consistent with data',
      'not impossible'
    ], C.amber)
  );

  // ============================================================
  // 27: Introduce p as the probability of a yes-or-no event.
  // ============================================================

  const symbolY = P ? -0.44 : -0.43;

  const pCard = new M.VGroup(
    rounded(
      P ? 5.75 : 5.95,
      2.44,
      CX,
      symbolY,
      C.violet
    ),
    txt(
      'p',
      52,
      C.violet,
      CX,
      symbolY + 0.36,
      true
    ),
    txt(
      'chance of score 1',
      P ? 22 : 23,
      C.ink,
      CX,
      symbolY - 0.44
    ),
    txt(
      'or our estimate of that chance',
      17,
      C.muted,
      CX,
      symbolY - 0.88
    )
  );

  await until(S(27));
  await play(
    ...swap([pCard]),
    ...say('p = CHANCE OF THE EVENT', C.violet),
    ...fbox([
      ['p = chance', C.violet],
      'true chance, if known',
      'otherwise use its estimate'
    ], C.violet)
  );

  // ============================================================
  // 28–29: Formal Monte Carlo standard error formula.
  // ============================================================

  const FORMULA_Y = P ? -0.34 : -0.40;

  const formalFormula = fraction(
    '√(p × (1 − p))',
    '√runs',
    FORMULA_Y,
    {
      left: 'SE =',
      size: P ? 27 : 28,
      width: 4.04
    }
  );

  const formalFrame = outline(
    P ? 6.05 : 6.20,
    1.98,
    CX,
    FORMULA_Y,
    C.violet
  );

  const formalHeading = txt(
    'MONTE CARLO ERROR',
    P ? 24 : 26,
    C.violet,
    CX,
    P ? 1.36 : 1.23,
    true
  );

  // 28: The short formula.
  await until(S(28));
  await play(
    ...swap([
      formalHeading,
      formalFrame,
      formalFormula
    ]),
    ...say('MONTE CARLO ERROR = √VARIANCE ÷ √RUNS', C.green),
    ...fbox([
      ['SE = √(p(1 − p))', C.amber],
      ['     / √runs', C.violet]
    ], C.green)
  );

  // 29: Read it in ordinary words.

  const explanationY = P ? -2.53 : -2.10;

  const explanationCard = new M.VGroup(
    rounded(
      P ? 5.86 : 6.06,
      P ? 1.10 : 0.94,
      CX,
      explanationY,
      C.green
    ),
    txt(
      'SPREAD OF ONE YES-OR-NO RUN',
      P ? 17 : 18,
      C.amber,
      CX,
      explanationY + 0.20,
      true
    ),
    txt(
      'divided by √(number of runs)',
      P ? 18 : 19,
      C.violet,
      CX,
      explanationY - 0.22
    )
  );

  await until(S(29));
  await play(
    ...add(explanationCard),
    new M.Indicate(
      formalFormula,
      { color: C.green }
    ),
    ...say('ONE RUN’S SPREAD ÷ √RUNS', C.green),
    ...fbox([
      ['numerator: score SD', C.amber],
      ['denominator: √runs', C.violet],
      ['result: error of estimate', C.green]
    ], C.green)
  );

  // ============================================================
  // 30–31: A hundred times more runs gives ten times less error.
  //
  // Compare two normal approximation pictures around true p.
  // Both use the same horizontal chance scale.
  // Heights are scaled separately to emphasize spread.
  // ============================================================

  const SCALE_MIN = 0.00;
  const SCALE_MAX = 0.20;

  const SCALE_X0 = CX - 2.76;
  const SCALE_X1 = CX + 2.76;

  const sx = v =>
    SCALE_X0 +
    (v - SCALE_MIN) /
    (SCALE_MAX - SCALE_MIN) *
    (SCALE_X1 - SCALE_X0);

  function errorBellPanel(
    n,
    base,
    height,
    color
  ) {
    const sd = monteError(TRUE_P, n);

    const parts = [
      line(
        SCALE_X0,
        base,
        SCALE_X1,
        base,
        C.muted, 1.8
      ),
      bellCurve(
        TRUE_P,
        sd,
        color,
        base,
        height,
        sx,
        SCALE_MIN,
        SCALE_MAX
      ),
      dashed(
        sx(TRUE_P),
        base,
        sx(TRUE_P),
        base + height + 0.12,
        C.green
      ),
      txt(
        `${commas(n)} RUNS`,
        P ? 18 : 19,
        color,
        CX - 1.48,
        base + height + 0.32,
        true
      ),
      txt(
        `SE = ${fmt(sd)}`,
        P ? 18 : 19,
        C.amber,
        CX + 1.62,
        base + height + 0.32,
        true
      ),
      line(
        sx(TRUE_P - sd),
        base + 0.06,
        sx(TRUE_P + sd),
        base + 0.06,
        C.amber, 4.0
      ),
      line(
        sx(TRUE_P - sd),
        base - 0.08,
        sx(TRUE_P - sd),
        base + 0.15,
        C.amber, 2
      ),
      line(
        sx(TRUE_P + sd),
        base - 0.08,
        sx(TRUE_P + sd),
        base + 0.15,
        C.amber, 2
      )
    ];

    [0, 0.10, 0.20].forEach(v => {
      parts.push(
        txt(
          v.toFixed(2),
          16,
          v === 0.10
            ? C.green
            : C.muted,
          sx(v),
          base - 0.25,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const broadErrorPanel = errorBellPanel(
    100,
    P ? -0.55 : -0.14,
    P ? 1.27 : 0.87,
    C.cyan
  );

  const narrowErrorPanel = errorBellPanel(
    10000,
    P ? -3.75 : -2.70,
    P ? 1.30 : 0.90,
    C.green
  );

  const compareErrorNote = txt(
    'Same chance scale · heights scaled separately',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.45 : -3.30
  );

  // 30: Compare 100 with 10,000 runs.
  await until(S(30));
  await play(
    ...swap([
      broadErrorPanel,
      compareErrorNote
    ]),
    ...say('100 RUNS GAVE ERROR 0.03', C.cyan),
    ...fbox([
      '100 runs',
      'SE = 0.3 ÷ 10',
      ['   = 0.03', C.cyan]
    ], C.cyan)
  );

  await until(S(30) + 3.4);
  await play(
    ...add(narrowErrorPanel),
    ...say('10,000 RUNS GAVE ERROR 0.003', C.green),
    ...fbox([
      '10,000 runs',
      'SE = 0.3 ÷ 100',
      ['   = 0.003', C.green]
    ], C.green)
  );

  // 31: 100 times the runs, one tenth the error.

  const hundredTimesTag = tag(
    '100× RUNS',
    C.violet,
    CX - 1.44,
    P ? -1.42 : -0.92,
    18
  );

  const tenthErrorTag = tag(
    'ERROR ÷ 10',
    C.green,
    CX + 1.44,
    P ? -1.42 : -0.92,
    18
  );

  await until(S(31));
  await play(
    ...add(
      hundredTimesTag,
      tenthErrorTag
    ),
    ...say('100 TIMES MORE RUNS. 10 TIMES LESS ERROR.', C.green),
    ...fbox([
      '10,000 ÷ 100 = 100',
      '√100 = 10',
      ['0.03 ÷ 10 = 0.003', C.green]
    ], C.green)
  );

  // ============================================================
  // 32–33: Use the formula to choose the run count.
  // ============================================================

  const PLAN_W = P ? 5.88 : 6.10;
  const PLAN_H = P ? 1.00 : 0.85;

  const planYs = P
    ? [0.78, -0.84, -2.46]
    : [0.72, -0.65, -2.02];

  function planningRow(
    heading,
    value,
    y,
    color
  ) {
    return new M.VGroup(
      rounded(
        PLAN_W,
        PLAN_H,
        CX, y,
        color
      ),
      txt(
        heading,
        P ? 18 : 19,
        C.ink,
        CX - 1.35,
        y,
        false,
        2.85
      ),
      txt(
        value,
        P ? 24 : 26,
        color,
        CX + 1.66,
        y,
        true,
        2.15
      )
    );
  }

  const planningTarget = planningRow(
    'Target error',
    '0.01',
    planYs[0],
    C.amber
  );

  const planningQuestion = planningRow(
    'Number of runs',
    '?',
    planYs[1],
    C.violet
  );

  const planningGoal = tag(
    'DECIDE YOUR REQUIRED PRECISION FIRST',
    C.green,
    CX,
    P ? -3.43 : -2.63,
    16
  );

  // 32: The formula helps us plan a simulation.
  await until(S(32));
  await play(
    ...swap([
      planningTarget,
      planningQuestion,
      planningGoal
    ]),
    ...say('CHOOSE HOW PRECISE YOUR SIMULATION MUST BE', C.green),
    ...fbox([
      'choose a target SE',
      'then calculate',
      ['how many runs are needed', C.green]
    ], C.green)
  );

  // 33: About 900 runs give an SE of 0.01.

  const rootNeeded = planningRow(
    'Required √runs',
    '30',
    planYs[1],
    C.violet
  );

  const runsNeeded = planningRow(
    'Required runs',
    '900',
    planYs[2],
    C.green
  );

  const enoughNote = txt(
    'Target is a typical error, not a guaranteed bound',
    14,
    C.muted,
    CX,
    P ? -3.56 : -2.76
  );

  await until(S(33));
  await play(
    ...remove(
      planningQuestion,
      planningGoal
    ),
    ...add(rootNeeded),
    ...say('TARGET ERROR = 0.01', C.amber),
    ...fbox([
      '0.3 ÷ √runs = 0.01',
      '√runs = 0.3 ÷ 0.01',
      ['√runs = 30', C.violet]
    ], C.violet)
  );

  await until(S(33) + 2.6);
  await play(
    ...add(
      runsNeeded,
      enoughNote
    ),
    ...say('30 × 30 = 900 RUNS', C.green),
    ...fbox([
      'runs = 30²',
      ['     = 900', C.green],
      'SE = 0.01'
    ], C.green)
  );

  // ============================================================
  // 34: Common trap — more runs do not repair a wrong model.
  // ============================================================

  const TRAP_Y = P ? -0.38 : -0.44;

  function errorTypeCard(
    x,
    title,
    subtitle,
    symbol,
    color
  ) {
    return new M.VGroup(
      rounded(
        2.80,
        P ? 2.78 : 2.58,
        x,
        TRAP_Y,
        color
      ),
      txt(
        title,
        18,
        color,
        x,
        TRAP_Y + 0.88,
        true,
        2.58
      ),
      txt(
        symbol,
        40,
        color,
        x,
        TRAP_Y + 0.06,
        true
      ),
      txt(
        subtitle,
        16,
        C.ink,
        x,
        TRAP_Y - 0.83,
        false,
        2.57
      )
    );
  }

  const randomErrorCard = errorTypeCard(
    CX - 1.59,
    'CHANCE ERROR',
    'Shrinks with more runs',
    '↓',
    C.green
  );

  const modelErrorCard = errorTypeCard(
    CX + 1.59,
    'MODEL ERROR',
    'Not fixed by more runs',
    '≠',
    LATE
  );

  const errorTypesNote = tag(
    'THESE ARE TWO DIFFERENT ERRORS',
    C.amber,
    CX,
    P ? -2.86 : -2.35,
    17
  );

  await until(S(34));
  await play(
    ...swap([
      randomErrorCard,
      modelErrorCard,
      errorTypesNote
    ]),
    ...say('TRAP: MORE RUNS ONLY SHRINK CHANCE ERROR', LATE),
    ...fbox([
      ['Monte Carlo error', C.green],
      'shrinks with more runs',
      ['wrong model: not repaired', LATE]
    ], LATE)
  );

  // ============================================================
  // 35: Suppose the actual late chance is 0.2,
  // but our simulation still uses 0.1.
  // ============================================================

  function tenParcelModel(
    lateCount,
    x,
    y,
    title,
    color
  ) {
    const w = 2.85;
    const h = P ? 2.60 : 2.46;

    const parts = [
      rounded(
        w, h,
        x, y,
        color
      ),
      txt(
        title,
        18,
        color,
        x,
        y + h / 2 - 0.32,
        true,
        w - 0.18
      )
    ];

    for (let k = 0; k < 10; k++) {
      const col = k % 5;
      const row = Math.floor(k / 5);

      parts.push(
        parcel(
          x + (col - 2) * 0.46,
          y + 0.29 - row * 0.48,
          k < lateCount
            ? LATE
            : NOT_LATE,
          0.31
        )
      );
    }

    parts.push(
      txt(
        `p = ${(lateCount / 10).toFixed(1)}`,
        27,
        color,
        x,
        y - h / 2 + 0.37,
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const assumedModel = tenParcelModel(
    1,
    CX - 1.60,
    P ? -0.38 : -0.43,
    'OUR SIMULATION',
    C.cyan
  );

  const actualModel = tenParcelModel(
    2,
    CX + 1.60,
    P ? -0.38 : -0.43,
    'ACTUAL DEPOT',
    C.green
  );

  const wrongModelTag = tag(
    'THE MODEL DOES NOT MATCH REALITY',
    LATE,
    CX,
    P ? -2.92 : -2.36,
    18
  );

  await until(S(35));
  await play(
    ...swap([
      assumedModel,
      actualModel,
      wrongModelTag
    ]),
    ...say('SUPPOSE THE REAL CHANCE IS 0.2', LATE),
    ...fbox([
      ['simulation assumes 0.1', C.cyan],
      ['actual chance is 0.2', C.green],
      ['model is wrong', LATE]
    ], LATE)
  );

  // ============================================================
  // 36: A million runs can give a very precise wrong answer.
  //
  // Under the assumed model:
  //   n = 1,000,000
  //   SE = 0.3 / 1000 = 0.0003
  //
  // The sampling distribution concentrates near model p = 0.1,
  // not the actual depot probability of 0.2.
  // ============================================================

  const BIAS_AXIS_Y = P ? -1.75 : -1.45;

  const biasAxis = chanceAxis(
    BIAS_AXIS_Y,
    'chance'
  );

  const MILLION_SE = monteError(
    TRUE_P,
    1000000
  );

  const modelCenterX = ax(0.10);
  const actualCenterX = ax(0.20);

  const biasBellHeight = P ? 2.03 : 1.67;

  // Use a local range around the model probability so the very
  // narrow curve is still constructed accurately.
  const preciseWrongBell = bellCurve(
    0.10,
    MILLION_SE,
    C.cyan,
    BIAS_AXIS_Y,
    biasBellHeight,
    ax,
    0.10 - 5 * MILLION_SE,
    0.10 + 5 * MILLION_SE
  );

  const modelLocation = new M.VGroup(
    glowDot(
      modelCenterX,
      BIAS_AXIS_Y,
      C.cyan,
      0.09
    ),
    dashed(
      modelCenterX,
      BIAS_AXIS_Y,
      modelCenterX,
      BIAS_AXIS_Y + biasBellHeight + 0.08,
      C.cyan
    ),
    txt(
      'MODEL 0.10',
      17,
      C.cyan,
      modelCenterX - 0.22,
      BIAS_AXIS_Y + biasBellHeight + 0.34,
      true
    )
  );

  const actualLocation = new M.VGroup(
    dashed(
      actualCenterX,
      BIAS_AXIS_Y,
      actualCenterX,
      BIAS_AXIS_Y + biasBellHeight,
      C.green
    ),
    glowDot(
      actualCenterX,
      BIAS_AXIS_Y,
      C.green,
      0.09
    ),
    txt(
      'REAL 0.20',
      18,
      C.green,
      actualCenterX - 0.18,
      BIAS_AXIS_Y + biasBellHeight + 0.34,
      true
    )
  );

  const modelGapY =
    BIAS_AXIS_Y + biasBellHeight * 0.47;

  const modelGap = new M.VGroup(
    arrow(
      modelCenterX + 0.12,
      modelGapY,
      actualCenterX - 0.12,
      modelGapY,
      LATE
    ),
    txt(
      'MODEL BIAS',
      17,
      LATE,
      (modelCenterX + actualCenterX) / 2,
      modelGapY + 0.28,
      true
    )
  );

  const millionRunTag = tag(
    '1,000,000 RUNS · SE = 0.0003',
    C.cyan,
    CX,
    P ? -3.40 : -2.68,
    17
  );

  await until(S(36));
  await play(
    ...swap([
      biasAxis,
      preciseWrongBell,
      modelLocation,
      actualLocation,
      modelGap,
      millionRunTag
    ]),
    ...say('VERY PRECISE DOES NOT MEAN CORRECT', LATE),
    ...fbox([
      '1,000,000 runs',
      ['SE = 0.0003', C.cyan],
      'estimate near 0.1',
      ['reality is 0.2', LATE]
    ], LATE)
  );

  // ============================================================
  // 37: Check the model first, then choose the run count.
  // ============================================================

  const CHECK_W = P ? 5.85 : 6.06;

  const CHECK_Y1 = P ? 0.43 : 0.39;
  const CHECK_Y2 = P ? -1.67 : -1.49;

  function checklistCard(
    number,
    title,
    detail,
    y,
    color
  ) {
    return new M.VGroup(
      rounded(
        CHECK_W,
        P ? 1.37 : 1.20,
        CX, y,
        color
      ),
      glowDot(
        CX - CHECK_W / 2 + 0.52,
        y,
        color,
        0.18
      ),
      txt(
        number,
        21,
        C.ink,
        CX - CHECK_W / 2 + 0.52,
        y,
        true
      ),
      txt(
        title,
        P ? 21 : 23,
        color,
        CX + 0.27,
        y + 0.25,
        true,
        CHECK_W - 1.29
      ),
      txt(
        detail,
        17,
        C.ink,
        CX + 0.27,
        y - 0.27,
        false,
        CHECK_W - 1.29
      )
    );
  }

  const checkModelStep = checklistCard(
    '1',
    'CHECK THE MODEL',
    'Does it match the real depot?',
    CHECK_Y1,
    C.amber
  );

  const chooseRunsStep = checklistCard(
    '2',
    'CHOOSE THE RUN COUNT',
    'Use the standard error formula',
    CHECK_Y2,
    C.green
  );

  const checkOrderArrow = arrow(
    CX,
    CHECK_Y1 - 0.73,
    CX,
    CHECK_Y2 + 0.73,
    C.muted
  );

  await until(S(37));
  await play(
    ...swap([checkOrderArrow]),
    stagger(
      [checkModelStep, chooseRunsStep],
      1.40,
      0.30
    ),
    ...say('CHECK THE MODEL FIRST. THEN CHOOSE RUNS.', C.green),
    ...fbox([
      ['1. check the model', C.amber],
      ['2. control chance error', C.green]
    ], C.green)
  );

  // ============================================================
  // 38: Final one-picture summary.
  //
  // Yes-or-no runs → mean score → standard error.
  // Keep the complete formula and the reported estimate visible.
  // ============================================================

  const FINAL_GRID_Y = P ? 0.82 : 0.72;

  const FINAL_VALUES = [
    1, 0, 0, 0, 0,
    0, 0, 0, 0, 0
  ];

  const finalScoreCells = FINAL_VALUES.map(
    (score, k) => {
      const x =
        CX + (k % 10 - 4.5) *
        (P ? 0.57 : 0.58);

      return cell(
        score,
        x,
        FINAL_GRID_Y,
        score ? LATE : NOT_LATE,
        0.48,
        0.50
      );
    }
  );

  const finalScoresHeading = txt(
    'YES-OR-NO SCORES',
    P ? 18 : 19,
    C.cyan,
    CX,
    FINAL_GRID_Y + 0.58,
    true
  );

  const finalMeanY = P ? -0.29 : -0.17;

  const finalMean = tag(
    'ESTIMATED CHANCE = MEAN SCORE',
    C.green,
    CX,
    finalMeanY,
    17
  );

  const finalMeanArrow = arrow(
    CX,
    FINAL_GRID_Y - 0.32,
    CX,
    finalMeanY + 0.32,
    C.muted
  );

  const finalFormulaY = P ? -1.89 : -1.50;

  const finalFormula = fraction(
    '√(p × (1 − p))',
    '√runs',
    finalFormulaY,
    {
      size: P ? 26 : 27,
      width: 3.95
    }
  );

  const finalFormulaFrame = outline(
    P ? 6.05 : 6.20,
    P ? 1.79 : 1.70,
    CX,
    finalFormulaY,
    C.violet
  );

  const finalFormulaArrow = arrow(
    CX,
    finalMeanY - 0.30,
    CX,
    finalFormulaY + 0.94,
    C.muted
  );

  const finalEstimateTag = tag(
    'OUR ESTIMATE: 0.12 ± ABOUT 0.03',
    C.green,
    CX,
    P ? -3.53 : -2.67,
    18
  );

  const finalCondition = txt(
    'Independent runs · a suitable model',
    P ? 17 : 16,
    C.muted,
    CX,
    P ? -4.25 : -3.20
  );

  await until(S(38));
  await play(
    ...swap([
      finalScoresHeading,
      ...finalScoreCells,
      finalMeanArrow,
      finalMean
    ]),
    ...say('A SIMULATED CHANCE IS A MEAN', C.cyan),
    ...fbox([
      ['late = 1', LATE],
      ['not late = 0', NOT_LATE],
      ['chance estimate = mean', C.green]
    ], C.green)
  );

  await until(S(38) + 2.1);
  await play(
    ...add(
      finalFormulaArrow,
      finalFormulaFrame,
      finalFormula
    ),
    ...say('ERROR = ONE RUN’S SPREAD ÷ √RUNS', C.violet),
    ...fbox([
      ['Monte Carlo error', C.violet],
      'SE = √(p(1 − p))',
      ['     / √runs', C.green]
    ], C.violet)
  );

  await until(S(38) + 4.5);
  await play(
    ...add(
      finalEstimateTag,
      ...(P ? [finalCondition] : [])
    ),
    new M.Indicate(
      finalFormula,
      { color: C.green }
    ),
    ...say('MORE INDEPENDENT RUNS. LESS CHANCE ERROR.', C.green),
    ...fbox([
      ['estimate = 0.12', C.cyan],
      ['SE ≈ 0.03', C.amber],
      ['rough range: 0.06–0.18', C.green],
      'check the model too'
    ], C.green)
  );

  await until(E(38));
}
