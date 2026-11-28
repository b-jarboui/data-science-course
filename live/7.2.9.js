// lesson 7.2.9
// Tukey comparisons: one interval for every pair of means,
// with a shared margin that controls the overall false-alarm risk.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // PHONE STAGE: on the phone the picture is enlarged and moved down into the
  // middle of the frame; the pill sits under the title and the formula card at
  // the bottom. Each new picture object is mapped once, when it first appears
  // (FadeIn / Create / Transform target). Cards are marked so they are skipped.
  const M0 = L.M;
  const SK = 1.14, SY0 = 1.8, SY1 = 3.3;
  const hasStaged = m => !!m && (m.__st || (m.submobjects || []).some(hasStaged));
  const markStaged = m => { m.__st = true; (m.submobjects || []).forEach(markStaged); };
  function stage(m) {
    if (!P || !m || m.__st) return m;
    if (hasStaged(m)) { (m.submobjects || []).forEach(stage); m.__st = true; return m; }
    m.scale(SK, { aboutPoint: [0, SY0, 0] });
    const c = m.getCenter();
    m.moveTo([c[0], c[1] + SY1 - SY0, c[2]]);
    markStaged(m);
    return m;
  }
  const M = !P ? M0 : {
    ...M0,
    FadeIn: class extends M0.FadeIn { constructor(m, o) { super(stage(m), o); } },
    Create: class extends M0.Create { constructor(m, o) { super(stage(m), o); } },
    Transform: class extends M0.Transform { constructor(a, b, o) { super(a, stage(b), o); } }
  };

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  //
  // Batch A: 15, 17, 17, 19. Mean = 17.
  // Batch B: 18, 20, 20, 22. Mean = 20.
  // Batch C: 20, 22, 24, 26. Mean = 23.
  //
  // Pairwise differences:
  // B - A = 3 hours.
  // C - A = 6 hours.
  // C - B = 3 hours.
  //
  // From one-way ANOVA:
  // Within SS = 8 + 8 + 20 = 36.
  // Within df = 12 - 3 = 9.
  // Within mean square = 36 / 9 = 4.
  //
  // Standard error of one batch mean:
  // sqrt(4 / 4) = 1 hour.
  //
  // Tukey multiplier for 3 groups, 9 df, 95% confidence:
  // q ≈ 3.95.
  //
  // Shared margin = 3.95 × 1 = 3.95 hours.
  //
  // B - A: [-0.95, 6.95].
  // C - A: [ 2.05, 9.95].
  // C - B: [-0.95, 6.95].
  //
  // Only C - A excludes zero.
  // ------------------------------------------------------------

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const PINK = C.pink || '#f472b6';
  const VIOLET = C.violet;
  const GREEN = C.green;

  const groups = [
    {
      name: 'A',
      values: [15, 17, 17, 19],
      color: BLUE
    },
    {
      name: 'B',
      values: [18, 20, 20, 22],
      color: GOLD
    },
    {
      name: 'C',
      values: [20, 22, 24, 26],
      color: PINK
    }
  ];

  const sum = values =>
    values.reduce((s, v) => s + v, 0);

  const mean = values =>
    sum(values) / values.length;

  groups.forEach(g => {
    g.n = g.values.length;
    g.mean = mean(g.values);
    g.ss = sum(
      g.values.map(v => (v - g.mean) ** 2)
    );
  });

  const K = groups.length;
  const N = sum(groups.map(g => g.n));

  const GROUP_N = groups[0].n;

  const GRAND = mean(
    groups.flatMap(g => g.values)
  );

  const SS_BETWEEN = sum(
    groups.map(g => g.n * (g.mean - GRAND) ** 2)
  );

  const SS_WITHIN = sum(
    groups.map(g => g.ss)
  );

  const DF_BETWEEN = K - 1;
  const DF_WITHIN = N - K;

  const MS_BETWEEN =
    SS_BETWEEN / DF_BETWEEN;

  const MSE =
    SS_WITHIN / DF_WITHIN;

  const ANOVA_F =
    MS_BETWEEN / MSE;

  const ANOVA_P = Math.pow(
    1 + 2 * ANOVA_F / DF_WITHIN,
    -DF_WITHIN / 2
  );

  const SE_MEAN = Math.sqrt(
    MSE / GROUP_N
  );

  // Use the prescribed rounded Tukey multiplier.
  // This reproduces the chapter's displayed interval endpoints.

  const Q = 3.95;
  const MARGIN = Q * SE_MEAN;

  const ALPHA = 0.05;

  // These probabilities illustrate independent tests.
  // Actual pairwise tests sharing group means are dependent,
  // so the independent-test calculation is not their exact
  // family-wise false-alarm probability.

  const RISK_3 =
    1 - Math.pow(1 - ALPHA, 3);

  const PAIRS_10 =
    10 * 9 / 2;

  const RISK_45 =
    1 - Math.pow(1 - ALPHA, PAIRS_10);

  // Single unadjusted two-sided t interval, df = 9:
  // margin = tCritical × sqrt(2 × MSE / n).
  //
  // Expressed in units of SE_MEAN, its multiplier is
  // sqrt(2) × tCritical ≈ 3.20.
  //
  // This provides a like-for-like comparison with Tukey q.

  const SINGLE_T_CRIT = 2.262157;

  const SINGLE_Q =
    Math.sqrt(2) * SINGLE_T_CRIT;

  const SINGLE_MARGIN =
    SINGLE_Q * SE_MEAN;

  const pairs = [
    {
      label: 'B − A',
      left: groups[0],
      right: groups[1],
      color: GOLD
    },
    {
      label: 'C − A',
      left: groups[0],
      right: groups[2],
      color: PINK
    },
    {
      label: 'C − B',
      left: groups[1],
      right: groups[2],
      color: VIOLET
    }
  ];

  pairs.forEach(pair => {
    pair.gap =
      pair.right.mean - pair.left.mean;

    pair.low =
      pair.gap - MARGIN;

    pair.high =
      pair.gap + MARGIN;

    pair.excludesZero =
      pair.low > 0 || pair.high < 0;
  });

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  //
  // Phone frame: 8 × 14.22.
  // Keep content between y = -5.5 and 4.3.
  //
  // Laptop frame: 14.22 × 8.
  // Keep content between y = -3.0 and 2.3.
  //
  // Formula box above the diagram on phone,
  // to the right of the diagram on laptop.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 2.02, 0];

  // phone: BOXP y = bottom edge of the card
  const BOXP = P
    ? [0, -6.55, 0]
    : [4.3, -0.3, 0];

  const W = P ? FW - 1.4 : 6.8;

  const Y = y =>
    P ? 1.42 * y - 0.75 : y;

  const say = (s, color = BLUE) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // FORMULA BOX
  // Based on the approved arithmetic-mean lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = BLUE) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

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

    const maxw = P ? FW - 1.2 : 4.0;

    const factor = Math.min(
      1,
      maxw / wd,
      P ? 2.4 / ht : 1
    );

    const pos = [
      BOXP[0],
      P ? BOXP[1] + ht * factor / 2 : BOXP[1],
      0
    ];

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(pos);

    const left = pos[0] - wd / 2 + 0.35;
    const top = pos[1] + ht / 2 - 0.2 - lh / 2;

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

    if (factor < 1) {
      g.scale(factor);
      g.moveTo(pos);
    }

    markStaged(g);
    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const animations = [
      new M.FadeOut(boxNow)
    ];

    boxNow = null;

    return animations;
  }

  // ------------------------------------------------------------
  // VISUAL HELPERS
  // ------------------------------------------------------------

  const pt = (x, y) => [x, y, 0];

  function txt(
    s, x, y,
    color = C.ink,
    size = 20,
    mono = false,
    maxw = W
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function tag(
    s, x, y,
    color = BLUE,
    size = 17,
    maxw = W
  ) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(pt(x, y));

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color
    });
  }

  function rect(
    x, y,
    width, height,
    color = BLUE,
    opacity = 0.8,
    strokeWidth = 1
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function outline(
    x, y,
    width, height,
    color = BLUE,
    opacity = 0
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(color, opacity);
    r.moveTo(pt(x, y));

    return r;
  }

  function dot(
    x, y,
    color = BLUE,
    radius = 0.13
  ) {
    const halo = new M.Dot({
      point: pt(x, y),
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: pt(x, y),
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  function arrow(
    x1, y1, x2, y2,
    color = GOLD,
    head = 0.15,
    sw = 2.5
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(
        x1, y1,
        x2, y2,
        color, sw
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a - Math.PI / 5),
        y2 - head * Math.sin(a - Math.PI / 5),
        color, sw
      ),

      line(
        x2, y2,
        x2 - head * Math.cos(a + Math.PI / 5),
        y2 - head * Math.sin(a + Math.PI / 5),
        color, sw
      )
    );
  }

  function bracket(
    x1, x2, y,
    color = GOLD,
    cap = 0.10
  ) {
    return new M.VGroup(
      line(
        x1, y,
        x2, y,
        color, 3
      ),

      line(
        x1, y - cap,
        x1, y + cap,
        color, 2
      ),

      line(
        x2, y - cap,
        x2, y + cap,
        color, 2
      )
    );
  }

  function checkMark(x, y, color = GREEN) {
    return new M.VGroup(
      line(
        x - 0.13, y,
        x - 0.03, y - 0.12,
        color, 3
      ),

      line(
        x - 0.03, y - 0.12,
        x + 0.20, y + 0.16,
        color, 3
      )
    );
  }

  function warningMark(x, y, color = GOLD) {
    return new M.VGroup(
      line(
        x, y + 0.15,
        x, y - 0.025,
        color, 3
      ),

      dot(
        x, y - 0.14,
        color, 0.035
      )
    );
  }

  function signed(v, decimals = 0) {
    const a = Math.abs(v).toFixed(decimals);

    return v < 0
      ? `−${a}`
      : a;
  }

  // Track top-level objects only.
  // Never regroup already-visible objects to highlight them.

  let picture = [];

  function add(...objects) {
    picture.push(...objects);

    return objects.map(
      o => new M.FadeIn(o)
    );
  }

  function remove(...objects) {
    const active = objects.filter(
      o => picture.includes(o)
    );

    picture = picture.filter(
      o => !active.includes(o)
    );

    return active.map(
      o => new M.FadeOut(o)
    );
  }

  function replace(...objects) {
    const animations = picture.map(
      o => new M.FadeOut(o)
    );

    picture = objects.slice();

    return [
      ...animations,
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  const GX = k =>
    CX + (k - 1) * 2.03;

  // ------------------------------------------------------------
  // THREE-COLUMN BATTERY DOT PLOT
  //
  // Vertical coordinate = battery life in hours.
  // Duplicate readings receive horizontal offsets.
  // Cyan = A, amber = B, pink = C.
  // ------------------------------------------------------------

  const GY0 = Y(-2.05);
  const GY1 = Y(1.15);

  const gy = v =>
    GY0 +
    (v - 14) / 14 *
    (GY1 - GY0);

  function threeBatchPlot() {
    const parts = [
      line(
        CX - (P ? 2.8 : 3.02), GY0,
        CX - (P ? 2.8 : 3.02), GY1,
        C.muted, 1.8
      ),

      line(
        CX - (P ? 2.8 : 3.02), GY0,
        CX + 3.03, GY0,
        C.muted, 2
      )
    ];

    for (let v = 14; v <= 28; v += 2) {
      parts.push(
        txt(
          String(v),
          CX - (P ? 3.06 : 3.28),
          gy(v),
          C.muted, 15, true
        ),

        line(
          CX - 2.95, gy(v),
          CX + 3.03, gy(v),
          C.muted, 0.65
        )
      );
    }

    groups.forEach((g, k) => {
      const x = GX(k);

      parts.push(
        tag(
          g.name,
          x,
          GY0 - 0.36,
          g.color, 17
        ),

        line(
          x - 0.54,
          gy(g.mean),
          x + 0.54,
          gy(g.mean),
          g.color, 3.5
        ),

        txt(
          String(g.mean),
          x + 0.73,
          gy(g.mean),
          g.color, 16, true
        )
      );

      g.values.forEach((v, j) => {
        const count = g.values.filter(
          n => n === v
        ).length;

        const rank = g.values
          .slice(0, j)
          .filter(n => n === v)
          .length;

        const offset =
          (rank - (count - 1) / 2) * 0.27;

        parts.push(
          dot(
            x + offset,
            gy(v),
            g.color, 0.11
          )
        );
      });
    });

    return parts;
  }

  // ------------------------------------------------------------
  // 0: ANOVA FOUND A DIFFERENCE. NOW EXAMINE EVERY PAIR.
  // ------------------------------------------------------------

  const recallPlot =
    threeBatchPlot();

  const recallCaption = tag(
    'ANOVA: AT LEAST ONE DIFFERS',
    CX,
    Y(1.40),
    GREEN, 16
  );

  await until(S(0));
  await play(
    ...add(
      ...recallPlot,
      recallCaption
    ),

    ...fbox([
      `ANOVA: F = ${ANOVA_F}`,
      [`p ≈ ${ANOVA_P.toFixed(3)}`, GREEN],
      'which pairs differ?'
    ], GREEN),

    ...say('ANOVA FOUND A DIFFERENCE. WHICH PAIR?')
  );

  // ------------------------------------------------------------
  // 1: THREE BATCHES GIVE THREE POSSIBLE PAIRS
  //
  // A triangle makes the three possible connections visible.
  // Each edge represents one pairwise comparison.
  // ------------------------------------------------------------

  const trianglePositions = [
    [CX - 2.05, Y(-1.45)],
    [CX + 2.05, Y(-1.45)],
    [CX, Y(0.90)]
  ];

  function batchNode(k) {
    const g = groups[k];

    const [x, y] =
      trianglePositions[k];

    return new M.VGroup(
      outline(
        x, y,
        1.34, 0.80,
        g.color, 0.16
      ),

      txt(
        `BATCH ${g.name}`,
        x, y,
        g.color, 17,
        false, 1.19
      )
    );
  }

  const triangleEdges = [
    line(
      trianglePositions[0][0] + 0.71,
      trianglePositions[0][1],
      trianglePositions[1][0] - 0.71,
      trianglePositions[1][1],
      GOLD, 3
    ),

    line(
      trianglePositions[0][0] + 0.42,
      trianglePositions[0][1] + 0.43,
      trianglePositions[2][0] - 0.39,
      trianglePositions[2][1] - 0.43,
      PINK, 3
    ),

    line(
      trianglePositions[1][0] - 0.42,
      trianglePositions[1][1] + 0.43,
      trianglePositions[2][0] + 0.39,
      trianglePositions[2][1] - 0.43,
      VIOLET, 3
    )
  ];

  const triangleNodes =
    groups.map((_, k) => batchNode(k));

  const triangleLabels = [
    tag(
      'B − A',
      CX,
      Y(-1.45) - 0.37,
      GOLD, 17
    ),

    tag(
      'C − A',
      CX - 1.32,
      Y(-0.04),
      PINK, 17
    ),

    tag(
      'C − B',
      CX + 1.32,
      Y(-0.04),
      VIOLET, 17
    )
  ];

  const pairCount = tag(
    '3 POSSIBLE PAIRS',
    CX,
    Y(-2.43),
    GREEN, 19
  );

  await until(S(1));
  await play(
    ...replace(
      ...triangleEdges,
      ...triangleNodes,
      ...triangleLabels,
      pairCount
    ),

    ...fbox([
      ['B against A', GOLD],
      ['C against A', PINK],
      ['C against B', VIOLET],
      'three comparisons'
    ]),

    ...say('THREE GROUPS, THREE PAIRS')
  );

  // ------------------------------------------------------------
  // 2: FIND THE GAPS BETWEEN THEIR MEANS
  //
  // All three means share one hours number line.
  // ------------------------------------------------------------

  const HMIN = 14;
  const HMAX = 26;

  const HLINE_W =
    P ? 6.20 : 6.40;

  const HY = Y(-1.10);

  const hx = v =>
    CX - HLINE_W / 2 +
    (v - HMIN) / (HMAX - HMIN) *
    HLINE_W;

  function hoursAxis(y = HY) {
    const parts = [
      line(
        hx(HMIN), y,
        hx(HMAX), y,
        C.muted, 2.7
      )
    ];

    for (let v = HMIN; v <= HMAX; v++) {
      const major = v % 2 === 0;

      parts.push(
        line(
          hx(v), y - 0.07,
          hx(v), y + 0.07,
          C.muted,
          major ? 1.5 : 0.8
        )
      );

      if (major) {
        parts.push(
          txt(
            String(v),
            hx(v),
            y - 0.28,
            C.muted, 15, true
          )
        );
      }
    }

    parts.push(
      txt(
        'mean battery life in hours',
        CX,
        y - 0.75,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function meanMarker(g, y = HY) {
    return new M.VGroup(
      dashed(
        hx(g.mean),
        y,
        hx(g.mean),
        y + 0.55,
        g.color
      ),

      dot(
        hx(g.mean),
        y,
        g.color,
        0.15
      ),

      tag(
        `${g.name}: ${g.mean}`,
        hx(g.mean),
        y + 0.81,
        g.color, 17,
        1.65
      )
    );
  }

  function meanLinePicture() {
    return [
      hoursAxis(),

      ...groups.map(g =>
        meanMarker(g)
      )
    ];
  }

  const meanPicture =
    meanLinePicture();

  await until(S(2));
  await play(
    ...replace(...meanPicture),

    ...fbox([
      ['A mean = 17', BLUE],
      ['B mean = 20', GOLD],
      ['C mean = 23', PINK]
    ]),

    ...say('MEASURE THE GAPS BETWEEN THE MEANS')
  );

  // ------------------------------------------------------------
  // 3-5: MEASURE ALL THREE OBSERVED DIFFERENCES
  //
  // Draw each difference as an arrow on the common hours line.
  // These are observed gaps, not significance conclusions.
  // ------------------------------------------------------------

  function gapGuide(pair) {
    const y = HY + 1.53;

    return new M.VGroup(
      arrow(
        hx(pair.left.mean),
        y,
        hx(pair.right.mean),
        y,
        pair.color
      ),

      txt(
        `${pair.gap} HOURS`,
        (
          hx(pair.left.mean) +
          hx(pair.right.mean)
        ) / 2,
        y + 0.33,
        pair.color, 22, true
      ),

      dashed(
        hx(pair.left.mean),
        HY + 1.06,
        hx(pair.left.mean),
        y - 0.09,
        pair.color
      ),

      dashed(
        hx(pair.right.mean),
        HY + 1.06,
        hx(pair.right.mean),
        y - 0.09,
        pair.color
      )
    );
  }

  const gapBA =
    gapGuide(pairs[0]);

  const gapCA =
    gapGuide(pairs[1]);

  const gapCB =
    gapGuide(pairs[2]);

  await until(S(3));
  await play(
    ...add(gapBA),

    ...fbox([
      'B − A = 20 − 17',
      ['= 3 hours', GOLD]
    ], GOLD),

    ...say('B MINUS A: THREE HOURS', GOLD)
  );

  await until(S(4));
  await play(
    ...remove(gapBA),

    ...add(gapCA),

    ...fbox([
      'C − A = 23 − 17',
      ['= 6 hours', PINK]
    ], PINK),

    ...say('C MINUS A: SIX HOURS', PINK)
  );

  await until(S(5));
  await play(
    ...remove(gapCA),

    ...add(gapCB),

    ...fbox([
      'C − B = 23 − 20',
      ['= 3 hours', VIOLET]
    ], VIOLET),

    ...say('C MINUS B: THREE HOURS', VIOLET)
  );

  // ------------------------------------------------------------
  // 6: WHY NOT RUN THREE SEPARATE t-TESTS?
  //
  // Place the three candidate tests on separate cards.
  // Each test would have its own individual five-percent
  // false-alarm threshold.
  // ------------------------------------------------------------

  const TEST_Y = Y(-0.35);

  function testCard(pair, k) {
    const x = GX(k);

    return new M.VGroup(
      outline(
        x, TEST_Y,
        1.78, 2.02,
        pair.color, 0.06
      ),

      txt(
        pair.label,
        x,
        TEST_Y + 0.67,
        pair.color, 22, true
      ),

      txt(
        `gap ${pair.gap} h`,
        x,
        TEST_Y + 0.15,
        C.ink, 17, true
      ),

      line(
        x - 0.70,
        TEST_Y - 0.14,
        x + 0.70,
        TEST_Y - 0.14,
        C.muted, 1.2
      ),

      txt(
        't-test',
        x,
        TEST_Y - 0.47,
        pair.color, 19
      ),

      txt(
        '5% threshold',
        x,
        TEST_Y - 0.77,
        C.muted, 14
      )
    );
  }

  const testCards =
    pairs.map((pair, k) =>
      testCard(pair, k)
    );

  const threeTestQuestion = tag(
    'WHY NOT THREE INDIVIDUAL TESTS?',
    CX,
    Y(-2.10),
    VIOLET, 17
  );

  await until(S(6));
  await play(
    ...replace(
      ...testCards,
      threeTestQuestion
    ),

    ...fbox([
      'three pairs',
      'three individual t-tests?',
      ['watch the false alarms', GOLD]
    ], GOLD),

    ...say('WHY NOT TEST EACH PAIR SEPARATELY?', GOLD)
  );

  // ------------------------------------------------------------
  // 7: ONE TEST HAS A FIVE-PERCENT FALSE-ALARM RISK
  //
  // Twenty equally sized tiles illustrate the probability.
  // One highlighted tile represents 5% of the possible
  // outcomes under a true null hypothesis.
  //
  // This is a probability picture, not a simulated result.
  // ------------------------------------------------------------

  const RISK_Y = Y(-0.22);

  function probabilityTiles(
    x, y,
    count,
    highlighted,
    cols,
    pitch,
    normalColor = BLUE,
    warningColor = GOLD
  ) {
    const rows =
      Math.ceil(count / cols);

    const parts = [];

    for (let k = 0; k < count; k++) {
      const row =
        Math.floor(k / cols);

      const col =
        k % cols;

      parts.push(
        rect(
          x +
            (col - (cols - 1) / 2) *
            pitch,

          y +
            ((rows - 1) / 2 - row) *
            pitch,

          pitch * 0.83,
          pitch * 0.83,

          k < highlighted
            ? warningColor
            : normalColor,

          k < highlighted
            ? 0.92
            : 0.46
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const singleRiskTiles =
    probabilityTiles(
      CX,
      RISK_Y,
      20,
      1,
      10,
      0.51
    );

  const trueNullTag = tag(
    'WHEN THERE IS NO REAL GAP',
    CX,
    Y(1.02),
    VIOLET, 17
  );

  const singleRiskLegend = new M.VGroup(
    rect(
      CX - 2.25,
      RISK_Y - 0.97,
      0.30, 0.30,
      GOLD, 0.90
    ),

    txt(
      '5% false alarm',
      CX - 0.96,
      RISK_Y - 0.97,
      GOLD, 17
    ),

    rect(
      CX - 2.25,
      RISK_Y - 1.47,
      0.30, 0.30,
      BLUE, 0.50
    ),

    txt(
      '95% no false alarm',
      CX - 0.70,
      RISK_Y - 1.47,
      BLUE, 17
    )
  );

  await until(S(7));
  await play(
    ...replace(
      trueNullTag,
      singleRiskTiles,
      singleRiskLegend
    ),

    ...fbox([
      'one test at the 5% level',
      'when its null is true',
      ['false-alarm risk = 5%', GOLD]
    ], GOLD),

    ...say('ONE TEST, ONE CHANCE OF A FALSE ALARM', GOLD)
  );

  // ------------------------------------------------------------
  // 8: THREE TESTS GIVE THREE CHANCES FOR A FALSE ALARM
  //
  // Independent-test illustration:
  //
  // P(no false alarms) = 0.95^3 = 0.857375.
  // P(at least one) = 1 - 0.95^3 = 0.142625.
  //
  // Real pairwise comparisons are dependent because they
  // share group means. Explicitly label 14% as an independent
  // illustration, not the exact probability for these pairs.
  // ------------------------------------------------------------

  const FAMILY_Y = Y(0.30);

  function miniRiskCard(k) {
    const x = GX(k);

    return new M.VGroup(
      outline(
        x,
        FAMILY_Y,
        1.78, 1.68,
        pairs[k].color, 0.045
      ),

      txt(
        pairs[k].label,
        x,
        FAMILY_Y + 0.55,
        pairs[k].color, 18, true
      ),

      probabilityTiles(
        x,
        FAMILY_Y - 0.10,
        20,
        1,
        5,
        0.24,
        BLUE,
        GOLD
      )
    );
  }

  const miniRiskCards =
    pairs.map((_, k) =>
      miniRiskCard(k)
    );

  const familyBarY = Y(-1.10);

  const familyBarW = 5.63;

  const familyLeft =
    CX - familyBarW / 2;

  const familyRiskW =
    familyBarW * RISK_3;

  const familySafeW =
    familyBarW * (1 - RISK_3);

  const familyRiskBar = new M.VGroup(
    rect(
      familyLeft + familySafeW / 2,
      familyBarY,
      familySafeW,
      0.52,
      BLUE, 0.62
    ),

    rect(
      familyLeft +
        familySafeW +
        familyRiskW / 2,
      familyBarY,
      familyRiskW,
      0.52,
      GOLD, 0.92
    ),

    txt(
      '85.7% no alarm',
      familyLeft + familySafeW / 2,
      familyBarY,
      C.ink, 17,
      false, familySafeW - 0.12
    ),

    txt(
      '14.3%',
      P ? familyLeft + familySafeW + familyRiskW / 2 : familyLeft + familyBarW + 0.6,
      P ? familyBarY + 0.5 : familyBarY,
      GOLD, 18, true,
      2
    )
  );

  const familyRiskTitle = tag(
    '≈ 14% AT LEAST ONE FALSE ALARM',
    CX,
    Y(-1.88),
    GOLD, 17
  );

  const independentNote = txt(
    'illustration: independent tests',
    CX,
    Y(-2.48),
    C.muted, 15
  );

  await until(S(8));
  await play(
    ...replace(
      ...miniRiskCards
    ),

    ...fbox([
      'three chances to be fooled',
      'each test uses 5%',
      ['overall risk grows', GOLD]
    ], GOLD),

    ...say('THREE TESTS, THREE CHANCES TO BE FOOLED', GOLD)
  );

  await until(S(8) + 3.0);
  await play(
    ...add(
      familyRiskBar,
      familyRiskTitle,
      independentNote
    ),

    ...fbox([
      'if tests are independent:',
      '1 − 0.95³',
      [`≈ ${(100 * RISK_3).toFixed(1)}%`, GOLD]
    ], GOLD),

    ...say('THE COMBINED RISK CAN BE MUCH LARGER', GOLD)
  );

  // ------------------------------------------------------------
  // 9: TEN GROUPS GIVE FORTY-FIVE PAIRS
  //
  // Draw all unordered group pairs as a triangular matrix.
  // There are 9 + 8 + ... + 1 = 45 cells.
  //
  // Then illustrate how the false-alarm probability grows
  // if forty-five independent tests are conducted.
  // ------------------------------------------------------------

  const MATRIX_PITCH =
    P ? 0.38 : 0.30;

  const MATRIX_LEFT =
    CX - 2.50;

  const MATRIX_TOP =
    Y(0.93);

  function pairMatrix() {
    const parts = [];

    for (let r = 0; r < 10; r++) {
      const yy =
        MATRIX_TOP - r * MATRIX_PITCH;

      parts.push(
        txt(
          String(r + 1),
          MATRIX_LEFT - 0.30,
          yy,
          C.muted, 13, true,
          0.30
        )
      );

      for (let c = r + 1; c < 10; c++) {
        parts.push(
          rect(
            MATRIX_LEFT +
              c * MATRIX_PITCH,
            yy,
            MATRIX_PITCH * 0.83,
            MATRIX_PITCH * 0.83,
            VIOLET,
            0.68
          )
        );
      }
    }

    for (let c = 0; c < 10; c++) {
      parts.push(
        txt(
          String(c + 1),
          MATRIX_LEFT + c * MATRIX_PITCH,
          MATRIX_TOP + 0.36,
          C.muted, 13, true,
          0.30
        )
      );
    }

    return parts;
  }

  const matrixCount = tag(
    '45 PAIRS',
    CX + 2.10,
    Y(0.18),
    VIOLET, 22,
    2.15
  );

  const matrixFormula = txt(
    '10 × 9 ÷ 2',
    CX + 2.10,
    Y(-0.42),
    C.ink, 17, true,
    2.10
  );

  const matrixRisk = tag(
    '≈ 90% RISK',
    CX + 2.10,
    Y(-1.09),
    GOLD, 18,
    2.10
  );

  const matrixRiskNote = txt(
    'if independent',
    CX + 2.10,
    Y(-1.59),
    C.muted, 14,
    false, 2.10
  );

  await until(S(9));
  await play(
    ...replace(
      ...pairMatrix(),
      matrixCount,
      matrixFormula,
      matrixRisk,
      matrixRiskNote
    ),

    ...fbox([
      '10 groups → 45 pairs',
      'independent illustration:',
      '1 − 0.95⁴⁵',
      [`≈ ${(RISK_45 * 100).toFixed(1)}%`, GOLD]
    ], GOLD),

    ...say('MORE PAIRS MEANS MORE OPPORTUNITIES FOR FALSE ALARMS', GOLD)
  );

  // ------------------------------------------------------------
  // 10: ONE MARGIN THAT PROTECTS ALL PAIRS TOGETHER
  //
  // Show the three comparisons inside one shared outline.
  // The 5% limit now applies to the family of comparisons,
  // rather than independently to each comparison.
  // ------------------------------------------------------------

  const PROTECT_Y = Y(-0.24);

  function protectedPair(k) {
    const pair = pairs[k];

    const y =
      PROTECT_Y + (1 - k) * 0.63;

    return new M.VGroup(
      txt(
        pair.label,
        CX - 1.97,
        y,
        pair.color, 18, true
      ),

      line(
        CX - 0.87,
        y,
        CX + 2.03,
        y,
        VIOLET, 4
      ),

      dot(
        CX + 0.58,
        y,
        pair.color, 0.11
      )
    );
  }

  const protectionFrame = outline(
    CX,
    PROTECT_Y,
    5.72, 2.47,
    GREEN, 0.035
  );

  const protectedPairs =
    pairs.map((_, k) =>
      protectedPair(k)
    );

  const protectionTitle = tag(
    'PROTECT ALL THREE COMPARISONS',
    CX,
    PROTECT_Y + 1.57,
    GREEN, 17
  );

  const familyAlpha = tag(
    'TOTAL FALSE-ALARM RISK: 5%',
    CX,
    PROTECT_Y - 1.63,
    GREEN, 17
  );

  await until(S(10));
  await play(
    ...replace(
      protectionFrame,
      ...protectedPairs,
      protectionTitle,
      familyAlpha
    ),

    ...fbox([
      'one family of comparisons',
      'one simultaneous margin',
      ['overall risk = 5%', GREEN]
    ], GREEN),

    ...say('PROTECT EVERY PAIR AT ONCE', GREEN)
  );

  // ------------------------------------------------------------
  // INTERVAL PLOT HELPERS
  //
  // Horizontal coordinate = difference in hours.
  // Dot = observed difference.
  // Horizontal bar = interval of plausible differences.
  // Dashed vertical line = zero difference.
  //
  // The same scale is used in all interval pictures.
  // ------------------------------------------------------------

  const IMIN = -5;
  const IMAX = 11;

  const ILEFT =
    CX - 1.87;

  const IRIGHT =
    CX + 3.08;

  const IAXIS_Y =
    Y(-2.02);

  const IROWS = [
    Y(0.82),
    Y(-0.22),
    Y(-1.26)
  ];

  const ix = v =>
    ILEFT +
    (v - IMIN) / (IMAX - IMIN) *
    (IRIGHT - ILEFT);

  function intervalAxes(
    top = IROWS[0] + 0.40,
    withZero = true
  ) {
    const parts = [
      line(
        ix(IMIN),
        IAXIS_Y,
        ix(IMAX),
        IAXIS_Y,
        C.muted, 2.2
      )
    ];

    for (let v = -4; v <= 10; v += 2) {
      parts.push(
        line(
          ix(v),
          IAXIS_Y - 0.07,
          ix(v),
          IAXIS_Y + 0.07,
          C.muted, 1.3
        ),

        txt(
          signed(v),
          ix(v),
          IAXIS_Y - 0.28,
          v === 0 ? GOLD : C.muted,
          15, true,
          0.43
        )
      );
    }

    parts.push(
      txt(
        'difference in hours',
        (ILEFT + IRIGHT) / 2,
        IAXIS_Y - 0.66,
        C.muted, 16
      )
    );

    if (withZero) {
      parts.push(
        dashed(
          ix(0),
          IAXIS_Y,
          ix(0),
          top,
          GOLD
        ),

        txt(
          'ZERO',
          ix(0),
          top + 0.18,
          GOLD, 14, true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function intervalBar(
    center,
    low,
    high,
    y,
    color,
    withEndpoints = true
  ) {
    const parts = [
      rect(
        (ix(low) + ix(high)) / 2,
        y,
        ix(high) - ix(low),
        0.19,
        color, 0.13, 0
      ),

      line(
        ix(low), y,
        ix(high), y,
        color, 4
      ),

      line(
        ix(low), y - 0.13,
        ix(low), y + 0.13,
        color, 2.5
      ),

      line(
        ix(high), y - 0.13,
        ix(high), y + 0.13,
        color, 2.5
      ),

      dot(
        ix(center),
        y,
        color, 0.115
      ),

      txt(
        String(center),
        ix(center),
        y + 0.27,
        color, 17, true,
        0.66
      )
    ];

    if (withEndpoints) {
      parts.push(
        txt(
          signed(low, 2),
          ix(low),
          y - 0.30,
          color, 14, true,
          1.02
        ),

        txt(
          signed(high, 2),
          ix(high),
          y - 0.30,
          color, 14, true,
          1.02
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function intervalRow(
    pair,
    k,
    {
      decision = false,
      endpoints = true
    } = {}
  ) {
    const y = IROWS[k];

    const color = decision
      ? pair.excludesZero
        ? GREEN
        : C.muted
      : pair.color;

    const parts = [
      txt(
        pair.label,
        CX - 2.64,
        y,
        pair.color,
        18, true,
        1.30
      ),

      intervalBar(
        pair.gap,
        pair.low,
        pair.high,
        y,
        color,
        endpoints
      )
    ];

    if (decision) {
      parts.push(
        txt(
          pair.excludesZero
            ? 'excludes 0'
            : 'includes 0',
          CX - 2.45,
          y - 0.31,
          color,
          15,
          false, 1.1
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function fullIntervalPicture(
    decision = false
  ) {
    return [
      intervalAxes(),

      ...pairs.map((pair, k) =>
        intervalRow(pair, k, {
          decision,
          endpoints: true
        })
      )
    ];
  }

  // ------------------------------------------------------------
  // 11: PICTURE A GAP AS A DOT WITH AN INTERVAL ON BOTH SIDES
  //
  // Introduce the visual language using an illustrative
  // interval before calculating the actual Tukey margin.
  // ------------------------------------------------------------

  const DEMO_Y = Y(-0.27);

  const exampleAxis =
    intervalAxes(
      Y(0.78),
      false
    );

  const exampleDot = dot(
    ix(3),
    DEMO_Y,
    VIOLET, 0.16
  );

  const exampleDotLabel = tag(
    'OBSERVED GAP',
    ix(3),
    DEMO_Y + 0.87,
    VIOLET, 17
  );

  const exampleNote = txt(
    'illustration of an interval',
    CX,
    Y(1.24),
    C.muted, 15
  );

  await until(S(11));
  await play(
    ...replace(
      exampleAxis,
      exampleDot,
      exampleDotLabel,
      exampleNote
    ),

    ...fbox([
      'dot = observed gap',
      ['interval = a range around it', VIOLET]
    ], VIOLET),

    ...say('PICTURE EACH GAP AS A DOT ON A LINE', VIOLET)
  );

  const exampleLeftBar = new M.VGroup(
    line(
      ix(3),
      DEMO_Y,
      ix(-1),
      DEMO_Y,
      VIOLET, 4
    ),

    line(
      ix(-1),
      DEMO_Y - 0.13,
      ix(-1),
      DEMO_Y + 0.13,
      VIOLET, 2.5
    )
  );

  const exampleRightBar = new M.VGroup(
    line(
      ix(3),
      DEMO_Y,
      ix(7),
      DEMO_Y,
      VIOLET, 4
    ),

    line(
      ix(7),
      DEMO_Y - 0.13,
      ix(7),
      DEMO_Y + 0.13,
      VIOLET, 2.5
    )
  );

  const exampleIntervalLabel = txt(
    'an interval',
    ix(3),
    DEMO_Y - 0.55,
    VIOLET, 20
  );

  await until(S(11) + 2.7);
  await play(
    ...add(
      exampleLeftBar,
      exampleRightBar,
      exampleIntervalLabel
    ),

    new M.Indicate(
      exampleDot,
      { color: VIOLET }
    ),

    ...say('THE BAR STRETCHES BOTH WAYS', VIOLET)
  );

  // ------------------------------------------------------------
  // 12: HOW TO READ THE ZERO LINE
  //
  // Two illustrative intervals.
  // The first crosses zero.
  // The second remains positive.
  //
  // These examples introduce the interpretation, not the
  // final numerical Tukey results.
  // ------------------------------------------------------------

  const ZERO_DEMO_TOP = Y(0.45);
  const ZERO_DEMO_BOTTOM = Y(-0.93);

  const zeroDemoAxes =
    intervalAxes(
      ZERO_DEMO_TOP + 0.68,
      true
    );

  const crossesZero = new M.VGroup(
    txt(
      'CROSSES 0',
      CX - 2.64,
      ZERO_DEMO_TOP,
      GOLD, 15,
      false, 1.35
    ),

    intervalBar(
      3, -1, 7,
      ZERO_DEMO_TOP,
      GOLD,
      false
    ),

    txt(
      'zero is plausible',
      ix(3),
      ZERO_DEMO_TOP - 0.43,
      GOLD, 16
    )
  );

  const excludesZero = new M.VGroup(
    txt(
      'MISSES 0',
      CX - 2.64,
      ZERO_DEMO_BOTTOM,
      GREEN, 15,
      false, 1.35
    ),

    intervalBar(
      6, 2, 10,
      ZERO_DEMO_BOTTOM,
      GREEN,
      false
    ),

    txt(
      'evidence of a gap',
      ix(6),
      ZERO_DEMO_BOTTOM - 0.43,
      GREEN, 16
    )
  );

  const zeroCrossPoint = dot(
    ix(0),
    ZERO_DEMO_TOP,
    GOLD, 0.12
  );

  await until(S(12));
  await play(
    ...replace(
      zeroDemoAxes,
      crossesZero,
      excludesZero,
      zeroCrossPoint
    ),

    ...fbox([
      ['includes zero: uncertain', GOLD],
      ['excludes zero: significant', GREEN],
      'zero means no difference'
    ]),

    ...say('DOES THE INTERVAL CROSS ZERO?')
  );

  // ------------------------------------------------------------
  // 13: STEP ONE — BORROW THE WITHIN-BATCH VARIANCE
  //
  // From ANOVA:
  // A contributes 8.
  // B contributes 8.
  // C contributes 20.
  //
  // Pool 36 squared-hour units and divide by 9 df.
  // ------------------------------------------------------------

  const POOL_Y = Y(-0.73);
  const POOL_TOP = Y(0.98);

  function pooledVariancePicture() {
    const parts = [
      outline(
        CX,
        POOL_Y,
        5.35, 1.50,
        GREEN, 0.045
      )
    ];

    groups.forEach((g, k) => {
      parts.push(
        tag(
          `${g.name}: ${g.ss}`,
          GX(k),
          POOL_TOP,
          g.color, 18
        ),

        arrow(
          GX(k),
          POOL_TOP - 0.31,
          CX + (k - 1) * 1.44,
          POOL_Y + 0.82,
          g.color,
          0.12
        )
      );
    });

    let index = 0;

    groups.forEach(g => {
      for (let j = 0; j < g.ss; j++) {
        const row =
          Math.floor(index / 12);

        const col =
          index % 12;

        parts.push(
          rect(
            CX + (col - 5.5) * 0.35,
            POOL_Y + (1 - row) * 0.35,
            0.30,
            0.30,
            g.color, 0.87
          )
        );

        index++;
      }
    });

    parts.push(
      tag(
        'WITHIN MS = 36 ÷ 9 = 4',
        CX,
        Y(-2.28),
        GREEN, 19
      )
    );

    return parts;
  }

  await until(S(13));
  await play(
    ...replace(
      ...pooledVariancePicture()
    ),

    ...fbox([
      'step 1: within variance',
      '36 squared hours ÷ 9 df',
      ['MSE = 4 hours²', GREEN]
    ], GREEN),

    ...say('STEP 1: BORROW THE WITHIN VARIANCE FROM ANOVA', GREEN)
  );

  // ------------------------------------------------------------
  // 14: WOBBLE OF ONE BATCH MEAN
  //
  // MSE / n = 4 / 4 = 1 squared hour.
  // sqrt(1) = 1 hour.
  //
  // Visually share four variance units among four positions.
  // Each position receives one unit.
  // ------------------------------------------------------------

  const SHARE_Y = Y(-0.30);

  function meanVarianceSharing() {
    const parts = [
      txt(
        'FOUR BATTERIES IN ONE BATCH',
        CX,
        Y(1.11),
        BLUE, 17
      )
    ];

    for (let k = 0; k < 4; k++) {
      const x =
        CX + (k - 1.5) * 1.28;

      parts.push(
        outline(
          x,
          SHARE_Y,
          1.04, 1.22,
          BLUE, 0.055
        ),

        rect(
          x,
          SHARE_Y,
          0.67, 0.67,
          GREEN, 0.79
        ),

        txt(
          '1',
          x,
          SHARE_Y,
          C.ink, 24, true
        ),

        txt(
          `B${k + 1}`,
          x,
          SHARE_Y - 0.86,
          BLUE, 15, true
        )
      );
    }

    parts.push(
      tag(
        '4 ÷ 4 = 1 HOUR²',
        CX,
        Y(-2.13),
        GREEN, 19
      )
    );

    return parts;
  }

  await until(S(14));
  await play(
    ...replace(
      ...meanVarianceSharing()
    ),

    ...fbox([
      'variance of one mean',
      '4 ÷ 4',
      ['= 1 hour²', GREEN]
    ], GREEN),

    ...say('DIVIDE FOUR BY FOUR BATTERIES', GREEN)
  );

  const rootSide = 1.55;

  const rootY = Y(-0.29);

  const oneSquare = rect(
    CX,
    rootY,
    rootSide,
    rootSide,
    GREEN, 0.72, 2
  );

  const oneArea = txt(
    'AREA = 1',
    CX,
    rootY,
    C.ink, 21, true
  );

  const oneSide = bracket(
    CX - rootSide / 2,
    CX + rootSide / 2,
    rootY - rootSide / 2 - 0.31,
    VIOLET
  );

  const oneHour = tag(
    '√1 = 1 HOUR',
    CX,
    rootY - rootSide / 2 - 0.79,
    GREEN, 20
  );

  await until(S(14) + 2.5);
  await play(
    ...replace(
      oneSquare,
      oneArea,
      oneSide,
      oneHour
    ),

    ...fbox([
      'SE of one batch mean',
      '= √(4/4)',
      ['= 1 hour', GREEN]
    ], GREEN),

    ...say('ONE BATCH MEAN WOBBLES BY ABOUT ONE HOUR', GREEN)
  );

  // ------------------------------------------------------------
  // 15: A MULTIPLIER WIDE ENOUGH FOR ALL THREE PAIRS
  //
  // Three comparison dots each have a symmetric margin.
  // Introduce the common multiplier without revealing
  // its numerical value until the next sentence.
  // ------------------------------------------------------------

  const MULT_CENTER = CX + 0.32;

  const MULT_ROWS = [
    Y(0.82),
    Y(-0.24),
    Y(-1.30)
  ];

  function symmetricMargin(
    x, y,
    halfWidth,
    color,
    label
  ) {
    return new M.VGroup(
      txt(
        label,
        CX - 2.55,
        y,
        color, 17,
        false, 1.43
      ),

      bracket(
        x - halfWidth,
        x + halfWidth,
        y,
        color
      ),

      dot(
        x, y,
        color, 0.11
      )
    );
  }

  const multiplierQuestion = tag(
    'HOW WIDE SHOULD THE MARGIN BE?',
    CX,
    Y(1.37),
    VIOLET, 16
  );

  const equalMarginSketches =
    pairs.map((pair, k) =>
      symmetricMargin(
        MULT_CENTER,
        MULT_ROWS[k],
        1.94,
        pair.color,
        pair.label
      )
    );

  const allMarginTag = tag(
    'ONE MULTIPLIER FOR ALL PAIRS',
    CX,
    Y(-2.24),
    GREEN, 17
  );

  await until(S(15));
  await play(
    ...replace(
      multiplierQuestion,
      ...equalMarginSketches,
      allMarginTag
    ),

    ...fbox([
      'step 2: choose a multiplier',
      'wide enough for',
      ['all three pairs together', GREEN]
    ], VIOLET),

    ...say('STEP 2: FIND A SIMULTANEOUS MULTIPLIER', VIOLET)
  );

  // ------------------------------------------------------------
  // 16: TUKEY'S MULTIPLIER = 3.95
  //
  // It depends on:
  // number of groups = 3;
  // within degrees of freedom = 9;
  // simultaneous confidence level = 95%.
  // ------------------------------------------------------------

  const QTOP = Y(0.84);
  const QRESULT = Y(-1.10);

  function qInput(
    x,
    title,
    value,
    color
  ) {
    return new M.VGroup(
      outline(
        x,
        QTOP,
        1.77, 1.06,
        color, 0.07
      ),

      txt(
        title,
        x,
        QTOP + 0.28,
        color, 15,
        false, 1.62
      ),

      txt(
        value,
        x,
        QTOP - 0.18,
        color, 25, true,
        1.61
      )
    );
  }

  const qInputs = [
    qInput(
      GX(0),
      'GROUPS',
      '3',
      BLUE
    ),

    qInput(
      GX(1),
      'WITHIN df',
      '9',
      VIOLET
    ),

    qInput(
      GX(2),
      'CONFIDENCE',
      '95%',
      GREEN
    )
  ];

  const qArrows =
    groups.map((g, k) =>
      arrow(
        GX(k),
        QTOP - 0.59,
        CX + (k - 1) * 1.03,
        QRESULT + 0.77,
        VIOLET,
        0.12
      )
    );

  const qCard = new M.VGroup(
    outline(
      CX,
      QRESULT,
      4.76, 1.35,
      VIOLET, 0.08
    ),

    txt(
      'TUKEY MULTIPLIER',
      CX,
      QRESULT + 0.39,
      VIOLET, 18
    ),

    txt(
      'q ≈ 3.95',
      CX,
      QRESULT - 0.19,
      VIOLET, 30, true
    )
  );

  const tukeyCredit = txt(
    'named after statistician John Tukey',
    CX,
    Y(-2.36),
    C.muted, 15
  );

  await until(S(16));
  await play(
    ...replace(
      ...qInputs,
      ...qArrows,
      qCard,
      tukeyCredit
    ),

    ...fbox([
      '3 groups; 9 within df',
      '95% simultaneous confidence',
      ['Tukey q ≈ 3.95', VIOLET]
    ], VIOLET),

    ...say('TUKEY’S MULTIPLIER IS ABOUT 3.95', VIOLET)
  );

  // ------------------------------------------------------------
  // 17: WHY TUKEY USES A BIGGER MULTIPLIER
  //
  // Compare the unadjusted and adjusted margins using
  // the same units: one batch mean's standard error.
  //
  // Single t interval: sqrt(2) × 2.262 ≈ 3.20 hours.
  // Tukey simultaneous interval: 3.95 hours.
  //
  // Both are drawn around the same center.
  // ------------------------------------------------------------

  const WIDTH_SCALE = 0.65;

  const WIDE_TOP = Y(0.45);
  const WIDE_BOTTOM = Y(-1.15);

  function widthComparison(
    y,
    amount,
    color,
    title
  ) {
    const halfWidth =
      amount * WIDTH_SCALE;

    return new M.VGroup(
      txt(
        title,
        CX,
        y + 0.52,
        color, 17
      ),

      rect(
        CX,
        y,
        2 * halfWidth,
        0.42,
        color, 0.20
      ),

      bracket(
        CX - halfWidth,
        CX + halfWidth,
        y,
        color, 0.12
      ),

      dot(
        CX,
        y,
        color, 0.12
      ),

      txt(
        `±${amount.toFixed(2)} h`,
        CX,
        y - 0.43,
        color, 18, true
      )
    );
  }

  const singleWidth = widthComparison(
    WIDE_TOP,
    SINGLE_MARGIN,
    BLUE,
    'ONE UNADJUSTED PAIR'
  );

  const tukeyWidth = widthComparison(
    WIDE_BOTTOM,
    MARGIN,
    VIOLET,
    'ALL THREE PAIRS TOGETHER'
  );

  const marginCenterGuide = dashed(
    CX,
    WIDE_BOTTOM - 0.19,
    CX,
    WIDE_TOP + 0.19,
    C.muted
  );

  const largerMarginTag = tag(
    'WIDER TO PROTECT AGAINST THE LARGEST GAP',
    CX,
    Y(-2.36),
    GREEN, 15
  );

  await until(S(17));
  await play(
    ...replace(
      marginCenterGuide,
      singleWidth,
      tukeyWidth,
      largerMarginTag
    ),

    ...fbox([
      'same units: SE of one mean',
      [`single pair ≈ ${SINGLE_Q.toFixed(2)}`, BLUE],
      ['Tukey ≈ 3.95', VIOLET],
      'protect against largest gap'
    ], VIOLET),

    ...say('A WIDER MARGIN PROTECTS ALL COMPARISONS', VIOLET)
  );

  // ------------------------------------------------------------
  // 18: STEP THREE — COMPUTE THE SHARED MARGIN
  //
  // q × SE of one mean = 3.95 × 1 = 3.95 hours.
  //
  // Draw a margin ruler with three full one-hour units
  // and a final 0.95-hour unit.
  // ------------------------------------------------------------

  const RULER_Y = Y(-0.32);
  const RULER_W = 5.55;

  const RULER_LEFT =
    CX - RULER_W / 2;

  const RULER_RIGHT =
    CX + RULER_W / 2;

  function marginRuler() {
    const unitW =
      RULER_W / MARGIN;

    const amounts = [
      1, 1, 1, MARGIN - 3
    ];

    const parts = [
      txt(
        'ONE BATCH-MEAN SE = 1 HOUR',
        CX,
        RULER_Y + 0.99,
        GREEN, 17
      )
    ];

    let cursor = RULER_LEFT;

    amounts.forEach((amount, k) => {
      const width =
        amount * unitW;

      const x =
        cursor + width / 2;

      parts.push(
        rect(
          x,
          RULER_Y,
          width - 0.035,
          0.68,
          VIOLET,
          k < 3 ? 0.86 : 0.55
        ),

        txt(
          k < 3 ? '1 h' : '0.95 h',
          x,
          RULER_Y,
          C.ink, 17, true,
          width - 0.10
        )
      );

      cursor += width;
    });

    parts.push(
      bracket(
        RULER_LEFT,
        RULER_RIGHT,
        RULER_Y - 0.55,
        GREEN
      ),

      tag(
        'MARGIN = 3.95 HOURS',
        CX,
        RULER_Y - 1.10,
        GREEN, 21
      )
    );

    return parts;
  }

  await until(S(18));
  await play(
    ...replace(
      ...marginRuler()
    ),

    ...fbox([
      'step 3: margin',
      '3.95 × √(4/4)',
      ['= 3.95 hours', GREEN]
    ], GREEN),

    ...say('STEP 3: THE SHARED MARGIN IS 3.95 HOURS', GREEN)
  );

  // ------------------------------------------------------------
  // 19: BUILD EACH INTERVAL
  //
  // Lower endpoint = gap - 3.95.
  // Upper endpoint = gap + 3.95.
  //
  // Show one interval centered on the observed gap of 3.
  // Both halves have exactly the same length.
  // ------------------------------------------------------------

  const BUILD_Y = Y(-0.35);

  const buildCenter = pairs[0].gap;
  const buildLow = pairs[0].low;
  const buildHigh = pairs[0].high;

  const buildAxis =
    intervalAxes(
      BUILD_Y + 1.10,
      true
    );

  const buildDot = dot(
    ix(buildCenter),
    BUILD_Y,
    GOLD, 0.16
  );

  const buildGapLabel = tag(
    'GAP = 3',
    ix(buildCenter),
    BUILD_Y + 1.16,
    GOLD, 18
  );

  const buildMinus = arrow(
    ix(buildCenter) - 0.05,
    BUILD_Y + 0.47,
    ix(buildLow),
    BUILD_Y + 0.47,
    VIOLET
  );

  const buildPlus = arrow(
    ix(buildCenter) + 0.05,
    BUILD_Y + 0.47,
    ix(buildHigh),
    BUILD_Y + 0.47,
    VIOLET
  );

  const buildMarginLabels = [
    txt(
      '−3.95',
      (ix(buildCenter) + ix(buildLow)) / 2,
      BUILD_Y + 0.78,
      VIOLET, 17, true,
      1.18
    ),

    txt(
      '+3.95',
      (ix(buildCenter) + ix(buildHigh)) / 2,
      BUILD_Y + 0.78,
      VIOLET, 17, true,
      1.18
    )
  ];

  const buildInterval =
    intervalBar(
      buildCenter,
      buildLow,
      buildHigh,
      BUILD_Y,
      GOLD,
      true
    );

  await until(S(19));
  await play(
    ...replace(
      buildAxis,
      buildDot,
      buildGapLabel
    ),

    ...fbox([
      'interval = gap ± margin',
      ['gap − 3.95', VIOLET],
      ['gap + 3.95', VIOLET]
    ], VIOLET),

    ...say('BUILD EACH INTERVAL: GAP PLUS OR MINUS 3.95', VIOLET)
  );

  await until(S(19) + 2.4);
  await play(
    ...remove(buildDot),

    ...add(
      buildInterval,
      buildMinus,
      buildPlus,
      ...buildMarginLabels
    )
  );

  // ------------------------------------------------------------
  // 20: B MINUS A
  //
  // Gap = 3.
  // Lower = 3 - 3.95 = -0.95.
  // Upper = 3 + 3.95 = 6.95.
  //
  // The interval crosses zero.
  // ------------------------------------------------------------

  const mainIntervalAxes =
    intervalAxes();

  const rowBA =
    intervalRow(
      pairs[0],
      0,
      {
        decision: false,
        endpoints: true
      }
    );

  const crossingBA = dot(
    ix(0),
    IROWS[0],
    GOLD, 0.12
  );

  await until(S(20));
  await play(
    ...replace(
      mainIntervalAxes,
      rowBA,
      crossingBA
    ),

    ...fbox([
      ['B − A = 3', GOLD],
      '3 − 3.95 = −0.95',
      '3 + 3.95 = 6.95',
      ['includes zero', GOLD]
    ], GOLD),

    ...say('B MINUS A: ABOUT MINUS ONE TO SEVEN', GOLD)
  );

  // ------------------------------------------------------------
  // 21: C MINUS A
  //
  // Gap = 6.
  // Lower = 6 - 3.95 = 2.05.
  // Upper = 6 + 3.95 = 9.95.
  //
  // The entire interval lies above zero.
  // ------------------------------------------------------------

  const rowCA =
    intervalRow(
      pairs[1],
      1,
      {
        decision: false,
        endpoints: true
      }
    );

  const clearZeroCA = bracket(
    ix(0),
    ix(pairs[1].low),
    IROWS[1] + 0.46,
    GREEN,
    0.075
  );

  const clearZeroLabel = txt(
    'clear of 0',
    (ix(0) + ix(pairs[1].low)) / 2,
    IROWS[1] + 0.70,
    GREEN, 14,
    false, 1.07
  );

  await until(S(21));
  await play(
    ...remove(crossingBA),

    ...add(
      rowCA,
      clearZeroCA,
      clearZeroLabel
    ),

    ...fbox([
      ['C − A = 6', PINK],
      '6 − 3.95 = 2.05',
      '6 + 3.95 = 9.95',
      ['excludes zero', GREEN]
    ], GREEN),

    ...say('C MINUS A: ABOUT TWO TO TEN', GREEN)
  );

  // ------------------------------------------------------------
  // 22: C MINUS B
  //
  // Gap = 3.
  // Interval = [-0.95, 6.95].
  // This interval also crosses zero.
  // ------------------------------------------------------------

  const rowCB =
    intervalRow(
      pairs[2],
      2,
      {
        decision: false,
        endpoints: true
      }
    );

  const crossingCB = dot(
    ix(0),
    IROWS[2],
    GOLD, 0.12
  );

  await until(S(22));
  await play(
    ...remove(
      clearZeroCA,
      clearZeroLabel
    ),

    ...add(
      rowCB,
      crossingCB
    ),

    ...fbox([
      ['C − B = 3', VIOLET],
      '3 − 3.95 = −0.95',
      '3 + 3.95 = 6.95',
      ['includes zero', GOLD]
    ], GOLD),

    ...say('C MINUS B: ABOUT MINUS ONE TO SEVEN', GOLD)
  );

  // ------------------------------------------------------------
  // 23: ONLY ONE PAIR IS SHOWN TO DIFFER
  //
  // Recolor the significant interval green.
  // Recolor the inconclusive intervals muted.
  //
  // Preserve batch colors in the pair labels.
  // ------------------------------------------------------------

  const decisionPicture =
    fullIntervalPicture(true);

  const significantOutline = outline(
    CX + 0.04,
    IROWS[1],
    6.24,
    P ? 1.02 : 0.88,
    GREEN,
    0.025
  );

  const significantTitle = tag(
    'ONLY C − A EXCLUDES ZERO',
    CX,
    P ? Y(1.58) : -3.3,
    GREEN, 17
  );

  await until(S(23));
  await play(
    ...replace(
      ...decisionPicture,
      significantOutline,
      significantTitle
    ),

    ...fbox([
      'B − A: not established',
      ['C − A: C lasts longer', GREEN],
      'C − B: not established'
    ], GREEN),

    ...say('ONLY ONE PAIR IS SHOWN TO DIFFER', GREEN)
  );

  // ------------------------------------------------------------
  // 24: B MIGHT SIT BETWEEN THEM, BUT WE CANNOT TELL
  //
  // The observed B mean is exactly between A and C.
  // However, neither pair involving B has an interval
  // excluding zero.
  //
  // Do not claim that B equals either group.
  // ------------------------------------------------------------

  const uncertainMeans =
    meanLinePicture();

  const clearAC = new M.VGroup(
    bracket(
      hx(17),
      hx(23),
      HY + 1.62,
      GREEN
    ),

    txt(
      'C > A: ESTABLISHED',
      (hx(17) + hx(23)) / 2,
      HY + 1.95,
      GREEN, 17
    )
  );

  const uncertainB = new M.VGroup(
    outline(
      hx(20),
      HY + 0.39,
      1.58, 1.49,
      GOLD, 0.035
    ),

    txt(
      '?',
      hx(20),
      HY + 1.26,
      GOLD, 23
    )
  );

  const smallSampleNote = tag(
    'ONLY FOUR BATTERIES PER BATCH',
    CX,
    Y(-2.24),
    GOLD, 16
  );

  await until(S(24));
  await play(
    ...replace(
      ...uncertainMeans,
      clearAC,
      uncertainB,
      smallSampleNote
    ),

    ...fbox([
      'observed B mean = 20',
      'between A and C',
      ['B comparisons remain uncertain', GOLD]
    ], GOLD),

    ...say('B MAY BE BETWEEN THEM, BUT WE CANNOT TELL', GOLD)
  );

  // ------------------------------------------------------------
  // 25: TUKEY'S HONESTLY SIGNIFICANT DIFFERENCE
  //
  // Significant means the observed difference is difficult
  // to explain by chance under the relevant null hypothesis
  // and the assumptions of the statistical model.
  // ------------------------------------------------------------

  const tukeyNameCard = new M.VGroup(
    outline(
      CX,
      Y(0.25),
      5.97, 1.47,
      VIOLET, 0.075
    ),

    txt(
      'TUKEY HSD',
      CX,
      Y(0.25) + 0.34,
      VIOLET, 30
    ),

    txt(
      'Honestly Significant Difference',
      CX,
      Y(0.25) - 0.30,
      C.ink, 17,
      false, 5.60
    )
  );

  const significantMeaning = new M.VGroup(
    checkMark(
      CX - 2.25,
      Y(-1.15),
      GREEN
    ),

    txt(
      'SIGNIFICANT',
      CX - 0.62,
      Y(-1.15),
      GREEN, 20
    ),

    txt(
      'hard to explain by chance',
      CX,
      Y(-1.73),
      C.ink, 18
    )
  );

  const tukeyDefinition = tag(
    'SIMULTANEOUS PAIRWISE COMPARISONS',
    CX,
    Y(-2.40),
    VIOLET, 16
  );

  await until(S(25));
  await play(
    ...replace(
      tukeyNameCard,
      significantMeaning,
      tukeyDefinition
    ),

    ...fbox([
      ['Tukey HSD', VIOLET],
      'honestly significant difference',
      'controls false alarms',
      'across all pairs'
    ], VIOLET),

    ...say('TUKEY’S HONESTLY SIGNIFICANT DIFFERENCE', VIOLET)
  );

  // ------------------------------------------------------------
  // 26: THE MARGIN FORMULA
  //
  // margin = q × sqrt(MSE / n)
  //
  // Equal group sizes allow one common margin.
  //
  // The Tukey-Kramer extension uses pair-specific margins
  // when the group sizes differ, but that is not needed
  // for the fixed equal-size example.
  // ------------------------------------------------------------

  const FORM_Y = Y(-0.31);

  function formulaFactor(
    x,
    label,
    value,
    color
  ) {
    return new M.VGroup(
      outline(
        x,
        FORM_Y,
        2.55, 1.56,
        color, 0.075
      ),

      txt(
        label,
        x,
        FORM_Y + 0.45,
        color, 16,
        false, 2.39
      ),

      txt(
        value,
        x,
        FORM_Y - 0.13,
        color, 27, true,
        2.36
      )
    );
  }

  const formulaQ = formulaFactor(
    CX - 1.64,
    'TUKEY MULTIPLIER',
    '3.95',
    VIOLET
  );

  const formulaSE = formulaFactor(
    CX + 1.64,
    'SE OF ONE MEAN',
    '√(4/4)',
    GREEN
  );

  const formulaTimes = txt(
    '×',
    CX,
    FORM_Y,
    GOLD, 27
  );

  const formulaMarginResult = tag(
    '3.95 × 1 = 3.95 HOURS',
    CX,
    Y(-2.12),
    GREEN, 21
  );

  const formulaMarginTitle = txt(
    'MARGIN',
    CX,
    Y(1.24),
    VIOLET, 20
  );

  await until(S(26));
  await play(
    ...replace(
      formulaMarginTitle,
      formulaQ,
      formulaSE,
      formulaTimes,
      formulaMarginResult
    ),

    ...fbox([
      'margin = q × √(MSE/n)',
      'q = Tukey multiplier',
      'MSE = within variance',
      ['margin = 3.95 hours', GREEN]
    ], VIOLET),

    ...say('MARGIN = TUKEY MULTIPLIER TIMES STANDARD ERROR', VIOLET)
  );

  // ------------------------------------------------------------
  // 27: ONE SHARED MARGIN, WIDE ENOUGH FOR ALL PAIRS
  //
  // Return to the actual three intervals.
  // All have total width 2 × 3.95 = 7.90 hours.
  //
  // Highlight equal half-widths in the first interval,
  // then show the common simultaneous confidence level.
  // ------------------------------------------------------------

  const wordsPicture =
    fullIntervalPicture(false);

  const wordsMarginLeft = bracket(
    ix(pairs[0].low),
    ix(pairs[0].gap),
    IROWS[0] + 0.49,
    VIOLET,
    0.07
  );

  const wordsMarginRight = bracket(
    ix(pairs[0].gap),
    ix(pairs[0].high),
    IROWS[0] + 0.49,
    VIOLET,
    0.07
  );

  const wordsMarginLabels = [
    txt(
      '3.95',
      (
        ix(pairs[0].low) +
        ix(pairs[0].gap)
      ) / 2,
      IROWS[0] + 0.73,
      VIOLET, 15, true,
      1.10
    ),

    txt(
      '3.95',
      (
        ix(pairs[0].gap) +
        ix(pairs[0].high)
      ) / 2,
      IROWS[0] + 0.73,
      VIOLET, 15, true,
      1.10
    )
  ];

  await until(S(27));
  await play(
    ...replace(
      ...wordsPicture,
      wordsMarginLeft,
      wordsMarginRight,
      ...wordsMarginLabels
    ),

    ...fbox([
      'one common margin',
      ['±3.95 hours for every pair', VIOLET],
      '95% simultaneous confidence'
    ], VIOLET),

    ...say('ONE SHARED MARGIN KEEPS EVERY PAIR HONEST', GREEN)
  );

  // ------------------------------------------------------------
  // 28: WHAT IS TUKEY FOR?
  //
  // One omnibus ANOVA, followed by all pairwise comparisons.
  // Especially useful when no single comparison was planned.
  // ------------------------------------------------------------

  const FLOW_TOP = Y(0.86);
  const FLOW_MID = Y(-0.35);
  const FLOW_BOTTOM = Y(-1.83);

  const anovaFlow = new M.VGroup(
    outline(
      CX,
      FLOW_TOP,
      4.88, 0.87,
      GREEN, 0.075
    ),

    txt(
      'ANOVA: AT LEAST ONE DIFFERS',
      CX,
      FLOW_TOP,
      GREEN, 17,
      false, 4.63
    )
  );

  const tukeyFlow = new M.VGroup(
    outline(
      CX,
      FLOW_MID,
      3.28, 0.82,
      VIOLET, 0.075
    ),

    txt(
      'TUKEY COMPARISONS',
      CX,
      FLOW_MID,
      VIOLET, 17,
      false, 3.06
    )
  );

  const flowArrow = arrow(
    CX,
    FLOW_TOP - 0.49,
    CX,
    FLOW_MID + 0.47,
    VIOLET,
    0.12
  );

  const flowPairs =
    pairs.map((pair, k) =>
      new M.VGroup(
        outline(
          GX(k),
          FLOW_BOTTOM,
          1.76, 0.74,
          pair.color, 0.075
        ),

        txt(
          pair.label,
          GX(k),
          FLOW_BOTTOM,
          pair.color, 20, true
        )
      )
    );

  const flowPairArrows =
    pairs.map((pair, k) =>
      arrow(
        CX + (k - 1) * 0.60,
        FLOW_MID - 0.46,
        GX(k),
        FLOW_BOTTOM + 0.43,
        pair.color,
        0.11
      )
    );

  const flowCaption = txt(
    'all pairs, not a single pre-written question',
    CX,
    Y(-2.46),
    C.muted, 15
  );

  await until(S(28));
  await play(
    ...replace(
      anovaFlow,
      flowArrow,
      tukeyFlow,
      ...flowPairArrows,
      ...flowPairs,
      flowCaption
    ),

    ...fbox([
      'after ANOVA',
      'compare every pair of means',
      ['control the family-wise risk', GREEN]
    ], GREEN),

    ...say('USE TUKEY TO EXAMINE ALL PAIRS AFTER ANOVA', VIOLET)
  );

  // ------------------------------------------------------------
  // 29: THE TRAP — CROSSING ZERO DOES NOT PROVE EQUALITY
  //
  // Use the actual B-A interval.
  //
  // It contains zero, but it also contains positive gaps
  // such as 2 hours and 6 hours.
  //
  // The interval is consistent with a range of possible
  // true differences.
  // ------------------------------------------------------------

  const TRAP_Y = Y(-0.43);

  const trapAxis =
    intervalAxes(
      TRAP_Y + 1.07,
      true
    );

  const trapInterval =
    intervalBar(
      pairs[0].gap,
      pairs[0].low,
      pairs[0].high,
      TRAP_Y,
      GOLD,
      true
    );

  const trapTitle = tag(
    'B − A: −0.95 TO 6.95',
    CX,
    Y(1.17),
    GOLD, 18
  );

  const plausibleValues = [
    {
      value: 0,
      label: '0',
      color: GOLD
    },
    {
      value: 2,
      label: '+2',
      color: VIOLET
    },
    {
      value: 6,
      label: '+6',
      color: VIOLET
    }
  ];

  const plausibleMarkers =
    plausibleValues.map(v =>
      new M.VGroup(
        dot(
          ix(v.value),
          TRAP_Y,
          v.color,
          0.085
        ),

        dashed(
          ix(v.value),
          TRAP_Y + 0.12,
          ix(v.value),
          TRAP_Y + 0.72,
          v.color
        ),

        tag(
          v.label,
          ix(v.value),
          TRAP_Y + 0.95,
          v.color, 16,
          0.95
        )
      )
    );

  const trapCaption = txt(
    'zero is possible — so are nonzero gaps',
    CX,
    Y(-1.56),
    GOLD, 16
  );

  await until(S(29));
  await play(
    ...replace(
      trapAxis,
      trapInterval,
      trapTitle,
      ...plausibleMarkers,
      trapCaption
    ),

    ...fbox([
      'interval includes zero',
      'but also includes nonzero gaps',
      ['not proof of equality', GOLD]
    ], GOLD),

    ...say('TRAP: NOT SIGNIFICANT DOES NOT MEAN EQUAL', GOLD)
  );

  // ------------------------------------------------------------
  // 30: THE SMALL TEST CANNOT TELL THEM APART
  //
  // Return to the three simultaneous intervals.
  // Explicitly distinguish an established difference
  // from an inconclusive comparison.
  // ------------------------------------------------------------

  const uncertainPicture =
    fullIntervalPicture(true);

  const uncertainOutlineBA = outline(
    CX + 0.04,
    IROWS[0],
    6.24,
    P ? 1.02 : 0.87,
    GOLD,
    0.025
  );

  const uncertainOutlineCB = outline(
    CX + 0.04,
    IROWS[2],
    6.24,
    P ? 1.02 : 0.87,
    GOLD,
    0.025
  );

  await until(S(30));
  await play(
    ...replace(
      ...uncertainPicture,
      uncertainOutlineBA,
      uncertainOutlineCB
    ),

    ...fbox([
      'four batteries per group',
      'uncertainty remains wide',
      ['insufficient evidence ≠ equality', GOLD]
    ], GOLD),

    ...say('THIS SMALL TEST CANNOT TELL EVERY PAIR APART', GOLD)
  );

  // ------------------------------------------------------------
  // 31: ONE-SENTENCE SUMMARY
  //
  // Final picture:
  // All three Tukey intervals on a common difference axis.
  // One shared margin of ±3.95 hours.
  // 95% simultaneous confidence.
  //
  // B-A: inconclusive.
  // C-A: significant positive difference.
  // C-B: inconclusive.
  //
  // Under the classical ANOVA assumptions, Tukey's method
  // controls the family-wise error rate at 5%.
  // ------------------------------------------------------------

  const finalPicture =
    fullIntervalPicture(true);

  const finalHeader = tag(
    '95% SIMULTANEOUS INTERVALS',
    CX - 0.20,
    P ? Y(1.6) : -3.5,
    VIOLET, 17
  );

  const finalHighlight = outline(
    CX + 0.04,
    IROWS[1],
    6.24,
    P ? 1.02 : 0.88,
    GREEN,
    0.025
  );

  const finalMarginNote = txt(
    'shared margin: ±3.95 hours',
    CX,
    IAXIS_Y - 1.02,
    VIOLET, 15, true
  );

  await until(S(31));
  await play(
    ...replace(
      ...finalPicture,
      finalHeader,
      finalHighlight,
      finalMarginNote
    ),

    ...fbox([
      ['Tukey comparisons', VIOLET],
      'interval = gap ± 3.95 h',
      ['family-wise risk ≤ 5%', GREEN],
      ['only C > A established', GREEN]
    ], VIOLET),

    ...say('ONE INTERVAL PER PAIR, FIVE PERCENT OVERALL RISK', GREEN)
  );

  // Keep the final interval picture visible while
  // the narration completes its concluding sentence.

  await until(E(31));

  // ------------------------------------------------------------
  // END OF LESSON
  //
  // All sentence beats 0–31 are included.
  //
  // Shared chapter data are unchanged.
  //
  // ANOVA quantities are calculated directly from the
  // twelve prescribed battery measurements.
  //
  // Tukey multiplier uses the prescribed rounded value 3.95.
  // This reproduces the exact displayed endpoints:
  //
  // B-A: -0.95 to 6.95.
  // C-A:  2.05 to 9.95.
  // C-B: -0.95 to 6.95.
  //
  // The approximately 14% and 90% false-alarm probabilities
  // are explicitly labelled independent-test illustrations.
  // Actual pairwise comparisons share group means and
  // therefore are not mutually independent.
  //
  // The unadjusted single-test multiplier is converted
  // into the same standard-error units as Tukey q before
  // their widths are compared.
  //
  // One common margin is appropriate here because all
  // three groups have equal sample sizes.
  //
  // Classical Tukey inference assumes independent
  // observations, normally distributed errors and a
  // common population variance.
  //
  // Only C-A is established as a significant difference.
  // Intervals containing zero are not treated as proof
  // that the corresponding population means are equal.
  //
  // The early demonstration intervals and probability
  // tiles are illustrative teaching choices.
  //
  // Uses the supplied engine interface and reference
  // conventions, with separate phone and laptop layouts.
  //
  // Browser rendering and narration synchronization have
  // not been runtime-tested against the actual engine.
  // ------------------------------------------------------------
}
