// lesson 7.2.8
// Planned contrasts: test one pre-written weighted comparison
// of group means, with weights that add to zero.
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
  // Old supplier:
  //   Batch A: 15, 17, 17, 19. Mean = 17.
  //   Batch B: 18, 20, 20, 22. Mean = 20.
  //
  // New supplier:
  //   Batch C: 20, 22, 24, 26. Mean = 23.
  //
  // Planned contrast weights:
  //   A = -1/2, B = -1/2, C = +1.
  //
  // Old supplier average = (17 + 20) / 2 = 18.5.
  // Contrast = 23 - 18.5 = 4.5 hours.
  //
  // Within mean square from ANOVA = 4.
  // Within degrees of freedom = 9.
  //
  // SE² = 4 × (1/16 + 1/16 + 1/4)
  //     = 4 × 3/8
  //     = 1.5.
  //
  // SE = sqrt(1.5) ≈ 1.225 hours.
  // t = 4.5 / sqrt(1.5) ≈ 3.674.
  // df = 9.
  // Two-sided p ≈ 0.0051.
  // ------------------------------------------------------------

  const BLUE = C.cyan;
  const GOLD = C.amber;
  const PINK = C.pink || '#f472b6';
  const VIOLET = C.violet;
  const GREEN = C.green;

  const OLD = VIOLET;
  const NEW = PINK;

  const groups = [
    {
      name: 'A',
      supplier: 'old',
      values: [15, 17, 17, 19],
      color: BLUE,
      weight: -0.5
    },
    {
      name: 'B',
      supplier: 'old',
      values: [18, 20, 20, 22],
      color: GOLD,
      weight: -0.5
    },
    {
      name: 'C',
      supplier: 'new',
      values: [20, 22, 24, 26],
      color: PINK,
      weight: 1
    }
  ];

  const sum = values =>
    values.reduce((s, v) => s + v, 0);

  const mean = values =>
    sum(values) / values.length;

  groups.forEach(g => {
    g.n = g.values.length;
    g.mean = mean(g.values);
    g.deviations = g.values.map(v => v - g.mean);
    g.squares = g.deviations.map(d => d * d);
    g.ss = sum(g.squares);
    g.weightSquared = g.weight ** 2;
    g.contribution = g.weightSquared / g.n;
    g.weightedMean = g.weight * g.mean;
  });

  const N = sum(groups.map(g => g.n));
  const K = groups.length;

  const OLD_MEAN =
    (groups[0].mean + groups[1].mean) / 2;

  const NEW_MEAN = groups[2].mean;

  const CONTRAST = sum(
    groups.map(g => g.weightedMean)
  );

  const WEIGHT_SUM = sum(
    groups.map(g => g.weight)
  );

  const SS_WITHIN = sum(
    groups.map(g => g.ss)
  );

  const DF = N - K;

  const MSE = SS_WITHIN / DF;

  const WEIGHT_TERM = sum(
    groups.map(g => g.contribution)
  );

  const SE2 = MSE * WEIGHT_TERM;
  const SE = Math.sqrt(SE2);
  const TSTAT = CONTRAST / SE;

  const TCRIT = 2.262157;

  const WEIGHT_LABELS = ['−½', '−½', '+1'];
  const SQUARED_LABELS = ['¼', '¼', '1'];
  const TERM_LABELS = ['1/16', '1/16', '1/4'];

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  //
  // Phone: 8 × 14.22.
  // Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 × 8.
  // Content between y = -3.0 and 2.3.
  //
  // The central diagram occupies the left side on laptop
  // and the main central region on phone.
  //
  // Formula boxes sit on the right on laptop and above
  // the diagram on phone.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.95, 0]
    : [CX, 1.85, 0];

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
    cap = 0.12
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
        x - 0.14, y,
        x - 0.03, y - 0.12,
        color, 3
      ),

      line(
        x - 0.03, y - 0.12,
        x + 0.22, y + 0.17,
        color, 3
      )
    );
  }

  function crossMark(x, y, color = GOLD) {
    return new M.VGroup(
      line(
        x - 0.13, y - 0.13,
        x + 0.13, y + 0.13,
        color, 3
      ),

      line(
        x - 0.13, y + 0.13,
        x + 0.13, y - 0.13,
        color, 3
      )
    );
  }

  function squareUnits(
    x, y,
    n, color,
    pitch = 0.26,
    cols = Math.ceil(Math.sqrt(n))
  ) {
    if (n <= 0) return [];

    const rows = Math.ceil(n / cols);

    return Array.from({ length: n }, (_, k) => {
      const row = Math.floor(k / cols);
      const col = k % cols;

      return rect(
        x + (col - (cols - 1) / 2) * pitch,
        y + ((rows - 1) / 2 - row) * pitch,
        pitch * 0.86,
        pitch * 0.86,
        color, 0.86
      );
    });
  }

  // Track only top-level objects currently on screen.
  // Never create a new VGroup from live objects to highlight them.

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
  // BATTERY DOT PLOT
  //
  // The same chapter colors are used throughout:
  // A cyan, B amber, C pink.
  //
  // Horizontal position represents battery life in hours.
  // Duplicate readings stack vertically.
  // ------------------------------------------------------------

  const HMIN = 14;
  const HMAX = 27;

  const HW = P ? 6.20 : 6.40;

  const hx = v =>
    CX - HW / 2 +
    (v - HMIN) / (HMAX - HMIN) * HW;

  function hoursAxis(y, min = HMIN, max = HMAX) {
    const parts = [
      line(
        hx(min), y,
        hx(max), y,
        C.muted, 2.5
      )
    ];

    for (let v = min; v <= max; v++) {
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
            hx(v), y - 0.28,
            C.muted, 15, true,
            0.46
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  function hourDots(values, y, color) {
    return values.map((v, k) => {
      const repeated = values
        .slice(0, k)
        .filter(n => n === v)
        .length;

      return dot(
        hx(v),
        y + 0.24 + repeated * 0.31,
        color,
        0.105
      );
    });
  }

  function batchRow(k, y) {
    const g = groups[k];

    return new M.VGroup(
      hoursAxis(y),

      ...hourDots(
        g.values,
        y,
        g.color
      ),

      line(
        hx(g.mean),
        y - 0.09,
        hx(g.mean),
        y + 0.73,
        g.color, 3
      ),

      tag(
        `MEAN ${g.mean}`,
        hx(g.mean),
        y + 0.98,
        g.color, 15,
        1.90
      ),

      txt(
        g.name,
        CX - 3.10,
        y + 0.55,
        g.color, 18, true
      )
    );
  }

  // ------------------------------------------------------------
  // VERTICAL THREE-COLUMN PLOT
  //
  // Same orientation as the preceding ANOVA lesson.
  // ------------------------------------------------------------

  const GY0 = Y(-2.12);
  const GY1 = Y(1.22);

  const gy = v =>
    GY0 +
    (v - 14) / 14 *
    (GY1 - GY0);

  function threeBatchPlot(withMeans = true) {
    const parts = [
      line(
        CX - (P ? 2.8 : 3.03), GY0,
        CX - (P ? 2.8 : 3.03), GY1,
        C.muted, 1.8
      ),

      line(
        CX - (P ? 2.8 : 3.03), GY0,
        CX + 3.03, GY0,
        C.muted, 2
      )
    ];

    for (let v = 14; v <= 28; v += 2) {
      parts.push(
        txt(
          String(v),
          CX - (P ? 3.06 : 3.29),
          gy(v),
          C.muted, 15, true
        ),

        line(
          CX - (P ? 2.73 : 2.96), gy(v),
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
          GY0 - 0.38,
          g.color, 17
        )
      );

      if (withMeans) {
        parts.push(
          line(
            x - 0.57,
            gy(g.mean),
            x + 0.57,
            gy(g.mean),
            g.color, 3.5
          ),

          txt(
            String(g.mean),
            x + 0.74,
            gy(g.mean),
            g.color, 17, true
          )
        );
      }

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
  // 0: ANOVA FOUND A DIFFERENCE, BUT THE LAB HAD A SHARPER
  // QUESTION ALL ALONG
  // ------------------------------------------------------------

  const recallPlot =
    threeBatchPlot(true);

  const recallF = tag(
    'ANOVA: F = 9',
    CX,
    Y(1.38),
    GREEN, 18
  );

  await until(S(0));
  await play(
    ...add(
      ...recallPlot,
      recallF
    ),

    ...fbox([
      'recall one-way ANOVA',
      ['F = 9; p ≈ 0.007', GREEN],
      'not all means are equal'
    ], GREEN),

    ...say('ANOVA FOUND A DIFFERENCE')
  );

  // ------------------------------------------------------------
  // SUPPLIER CARDS
  //
  // A and B belong to the old supplier.
  // C belongs to the new supplier.
  //
  // Preserve individual batch colors inside the larger
  // supplier group outlines.
  // ------------------------------------------------------------

  const SUP_Y = Y(-0.50);

  function supplierBatch(k, y = SUP_Y) {
    const g = groups[k];

    const parts = [
      outline(
        GX(k),
        y,
        1.66, 1.47,
        g.color, 0.065
      ),

      txt(
        `BATCH ${g.name}`,
        GX(k),
        y + 0.45,
        g.color, 16,
        false, 1.54
      )
    ];

    for (let j = 0; j < 4; j++) {
      const row = Math.floor(j / 2);
      const col = j % 2;

      parts.push(
        dot(
          GX(k) + (col - 0.5) * 0.42,
          y - 0.08 +
            (0.5 - row) * 0.37,
          g.color,
          0.10
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function supplierPicture(y = SUP_Y) {
    const oldCenter =
      (GX(0) + GX(1)) / 2;

    const newCenter =
      GX(2);

    return [
      outline(
        oldCenter,
        y,
        4.00, 2.02,
        OLD, 0.025
      ),

      outline(
        newCenter,
        y,
        1.94, 2.02,
        NEW, 0.025
      ),

      supplierBatch(0, y),
      supplierBatch(1, y),
      supplierBatch(2, y),

      tag(
        'OLD SUPPLIER',
        oldCenter,
        y + 1.36,
        OLD, 17,
        3.72
      ),

      tag(
        'NEW SUPPLIER',
        newCenter,
        y + 1.36,
        NEW, 16,
        1.92
      )
    ];
  }

  // ------------------------------------------------------------
  // 1: A AND B ARE OLD SUPPLIER, C IS NEW SUPPLIER
  // ------------------------------------------------------------

  const supplierGroups =
    supplierPicture();

  await until(S(1));
  await play(
    ...replace(
      ...supplierGroups
    ),

    ...fbox([
      ['old supplier: A and B', OLD],
      ['new supplier: C', NEW]
    ]),

    ...say('TWO SUPPLIERS, THREE BATCHES')
  );

  // ------------------------------------------------------------
  // 2: WRITE ONE QUESTION BEFORE TESTING ANY BATTERY
  //
  // A chronological timeline emphasizes that the question
  // precedes the data.
  // ------------------------------------------------------------

  const TIME_Y = Y(-0.28);

  const TIME_LEFT = CX - 2.45;
  const TIME_RIGHT = CX + 2.45;

  function notebook(x, y, color = VIOLET) {
    const parts = [
      outline(
        x,
        y,
        1.45, 1.72,
        color, 0.08
      ),

      txt(
        'PLAN',
        x,
        y + 0.50,
        color, 18
      )
    ];

    for (let k = 0; k < 3; k++) {
      parts.push(
        line(
          x - 0.46,
          y + 0.08 - k * 0.27,
          x + 0.46,
          y + 0.08 - k * 0.27,
          C.muted, 1.5
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function batteryIcon(
    x, y,
    color = BLUE,
    width = 0.43,
    height = 0.75
  ) {
    return new M.VGroup(
      outline(
        x, y,
        width, height,
        color, 0.055
      ),

      rect(
        x,
        y + height / 2 + 0.05,
        width * 0.36,
        0.10,
        color, 1
      ),

      rect(
        x,
        y,
        width - 0.12,
        height - 0.17,
        color, 0.78, 0
      )
    );
  }

  function unopenedData(x, y) {
    return new M.VGroup(
      outline(
        x, y,
        1.54, 1.72,
        C.muted, 0.04
      ),

      batteryIcon(
        x - 0.30,
        y + 0.14,
        BLUE
      ),

      batteryIcon(
        x + 0.30,
        y + 0.14,
        PINK
      ),

      txt(
        'NOT TESTED',
        x,
        y - 0.61,
        C.muted, 14,
        false, 1.41
      )
    );
  }

  const planBook = notebook(
    TIME_LEFT,
    TIME_Y
  );

  const futureData = unopenedData(
    TIME_RIGHT,
    TIME_Y
  );

  const timeArrow = arrow(
    TIME_LEFT + 0.91,
    TIME_Y,
    TIME_RIGHT - 0.91,
    TIME_Y,
    C.muted
  );

  const planFirst = tag(
    '1. WRITE QUESTION',
    TIME_LEFT + 0.15,
    TIME_Y - 1.28,
    VIOLET, 16,
    2.52
  );

  const testLater = tag(
    '2. COLLECT DATA',
    TIME_RIGHT - 0.15,
    TIME_Y - 1.28,
    C.muted, 16,
    2.48
  );

  await until(S(2));
  await play(
    ...replace(
      planBook,
      futureData,
      timeArrow,
      planFirst,
      testLater
    ),

    ...fbox([
      'before any battery test',
      ['write one question', VIOLET]
    ], VIOLET),

    ...say('FIRST PLAN, THEN MEASURE', VIOLET)
  );

  // ------------------------------------------------------------
  // 3: DOES THE NEW SUPPLIER BEAT THE OLD AVERAGE?
  //
  // Visualize the intended comparison without revealing
  // any measured means yet.
  // ------------------------------------------------------------

  const QUESTION_TOP = Y(0.82);
  const QUESTION_MID = Y(-0.62);
  const QUESTION_BOTTOM = Y(-2.09);

  function questionBatch(k, x, y) {
    const g = groups[k];

    return new M.VGroup(
      outline(
        x, y,
        1.37, 0.83,
        g.color, 0.07
      ),

      txt(
        `BATCH ${g.name}`,
        x, y,
        g.color, 17,
        false, 1.23
      )
    );
  }

  const questionA = questionBatch(
    0,
    CX - 2.25,
    QUESTION_TOP
  );

  const questionB = questionBatch(
    1,
    CX - 0.56,
    QUESTION_TOP
  );

  const questionC = questionBatch(
    2,
    CX + 1.93,
    QUESTION_TOP
  );

  const oldAverageCard = new M.VGroup(
    outline(
      CX - 1.41,
      QUESTION_MID,
      2.70, 0.91,
      OLD, 0.085
    ),

    txt(
      'OLD AVERAGE',
      CX - 1.41,
      QUESTION_MID,
      OLD, 17,
      false, 2.50
    )
  );

  const newAverageCard = new M.VGroup(
    outline(
      CX + 1.93,
      QUESTION_MID,
      2.15, 0.91,
      NEW, 0.085
    ),

    txt(
      'NEW MEAN',
      CX + 1.93,
      QUESTION_MID,
      NEW, 17,
      false, 1.98
    )
  );

  const questionArrows = [
    arrow(
      CX - 2.25,
      QUESTION_TOP - 0.48,
      CX - 1.83,
      QUESTION_MID + 0.51,
      BLUE, 0.12
    ),

    arrow(
      CX - 0.56,
      QUESTION_TOP - 0.48,
      CX - 0.98,
      QUESTION_MID + 0.51,
      GOLD, 0.12
    ),

    arrow(
      CX + 1.93,
      QUESTION_TOP - 0.48,
      CX + 1.93,
      QUESTION_MID + 0.51,
      PINK, 0.12
    )
  ];

  const questionComparison = tag(
    'NEW − OLD AVERAGE?',
    CX,
    QUESTION_BOTTOM,
    VIOLET, 21
  );

  await until(S(3));
  await play(
    ...replace(
      questionA,
      questionB,
      questionC,
      ...questionArrows,
      oldAverageCard,
      newAverageCard,
      questionComparison
    ),

    ...fbox([
      'our pre-written question',
      'new supplier mean',
      ['minus old supplier average', VIOLET]
    ], VIOLET),

    ...say('DOES THE NEW SUPPLIER LAST LONGER?', VIOLET)
  );

  // ------------------------------------------------------------
  // 4: WHY WRITING THE QUESTION FIRST MATTERS
  //
  // Show the difference between a fixed question
  // and searching for an attractive result after observing data.
  // ------------------------------------------------------------

  function workflowCard(
    x, y,
    good
  ) {
    const color =
      good ? GREEN : GOLD;

    const parts = [
      outline(
        x, y,
        2.78, 2.65,
        color, 0.05
      ),

      txt(
        good ? 'PLAN FIRST' : 'LOOK FIRST',
        x,
        y + 0.96,
        color, 18
      )
    ];

    const steps = good
      ? ['write question', 'see data', 'test question']
      : ['see data', 'hunt for gap', 'test winner'];

    steps.forEach((s, k) => {
      const yy =
        y + 0.40 - k * 0.59;

      parts.push(
        txt(
          s,
          x,
          yy,
          k === 2 ? color : C.ink,
          16,
          false, 2.48
        )
      );

      if (k < 2) {
        parts.push(
          txt(
            '↓',
            x,
            yy - 0.29,
            C.muted, 13
          )
        );
      }
    });

    parts.push(
      good
        ? checkMark(x, y - 1.00, color)
        : crossMark(x, y - 1.00, color)
    );

    return new M.VGroup(...parts);
  }

  const workflowY = Y(-0.46);

  const goodWorkflow = workflowCard(
    CX - 1.65,
    workflowY,
    true
  );

  const badWorkflow = workflowCard(
    CX + 1.65,
    workflowY,
    false
  );

  const planningCaption = tag(
    'DO NOT HUNT FOR THE BIGGEST GAP',
    CX,
    Y(-2.36),
    GOLD, 16
  );

  await until(S(4));
  await play(
    ...replace(
      goodWorkflow,
      badWorkflow,
      planningCaption
    ),

    ...fbox([
      ['planned comparison', GREEN],
      'chosen independently of data',
      ['not the biggest-looking gap', GOLD]
    ], GREEN),

    ...say('PLANNING PROTECTS AGAINST CHERRY-PICKING', GREEN)
  );

  // ------------------------------------------------------------
  // 5: THE BATCH MEANS ARE 17, 20, 23
  //
  // Return to the real chapter measurements.
  // ------------------------------------------------------------

  const meansAxisY = Y(-0.96);

  function meanMarker(
    value,
    color,
    label,
    y = meansAxisY,
    lift = 0.87
  ) {
    return new M.VGroup(
      dashed(
        hx(value),
        y,
        hx(value),
        y + lift - 0.20,
        color
      ),

      dot(
        hx(value),
        y,
        color, 0.16
      ),

      tag(
        label,
        hx(value),
        y + lift,
        color, 17,
        1.65
      )
    );
  }

  function allMeansPicture() {
    const parts = [
      hoursAxis(meansAxisY),

      txt(
        'batch mean in hours',
        CX,
        meansAxisY - 0.75,
        C.muted, 16
      )
    ];

    groups.forEach(g => {
      parts.push(
        meanMarker(
          g.mean,
          g.color,
          `${g.name}: ${g.mean}`
        )
      );
    });

    return parts;
  }

  const realMeans =
    allMeansPicture();

  await until(S(5));
  await play(
    ...replace(...realMeans),

    ...fbox([
      ['mean A = 17 hours', BLUE],
      ['mean B = 20 hours', GOLD],
      ['mean C = 23 hours', PINK]
    ]),

    ...say('THE THREE MEANS: 17, 20, 23')
  );

  // ------------------------------------------------------------
  // 6: STEP ONE — FIND THE OLD SUPPLIER'S AVERAGE
  //
  // A and B receive equal weight.
  // Show their midpoint geometrically.
  //
  // 17 + 20 = 37.
  // 37 / 2 = 18.5.
  // ------------------------------------------------------------

  const AVG_Y = Y(-0.92);

  const avgAxis = hoursAxis(AVG_Y);

  const averageDotA = dot(
    hx(17),
    AVG_Y,
    BLUE, 0.16
  );

  const averageDotB = dot(
    hx(20),
    AVG_Y,
    GOLD, 0.16
  );

  const averageLabelA = tag(
    'A: 17',
    hx(17) - 0.25,
    AVG_Y + 0.85,
    BLUE, 18
  );

  const averageLabelB = tag(
    'B: 20',
    hx(20) + 0.25,
    AVG_Y + 0.85,
    GOLD, 18
  );

  const oldBracket = bracket(
    hx(17),
    hx(20),
    AVG_Y + 1.30,
    OLD
  );

  const equalShareCaption = txt(
    'EQUAL SHARE FROM EACH BATCH',
    CX,
    AVG_Y + 1.66,
    OLD, 16
  );

  await until(S(6));
  await play(
    ...replace(
      avgAxis,
      averageDotA,
      averageDotB,
      averageLabelA,
      averageLabelB,
      oldBracket,
      equalShareCaption
    ),

    ...fbox([
      'step 1: old average',
      '17 + 20 = 37',
      ['37 ÷ 2 = 18.5', OLD]
    ], OLD),

    ...say('STEP 1: AVERAGE A AND B', OLD)
  );

  const midpointY =
    AVG_Y - 0.08;

  const midpointA = arrow(
    hx(17),
    AVG_Y + 0.38,
    hx(18.5) - 0.07,
    AVG_Y + 0.38,
    BLUE, 0.10
  );

  const midpointB = arrow(
    hx(20),
    AVG_Y + 0.38,
    hx(18.5) + 0.07,
    AVG_Y + 0.38,
    GOLD, 0.10
  );

  const midpointDot = dot(
    hx(OLD_MEAN),
    midpointY,
    OLD, 0.18
  );

  const midpointLabel = tag(
    'OLD = 18.5',
    hx(OLD_MEAN),
    AVG_Y - 0.91,
    OLD, 19
  );

  await until(S(6) + 3.8);
  await play(
    ...add(
      midpointA,
      midpointB,
      midpointDot,
      midpointLabel
    ),

    new M.Indicate(
      midpointDot,
      { color: OLD }
    ),

    ...say('THE MIDPOINT IS EIGHTEEN AND A HALF', OLD)
  );

  // ------------------------------------------------------------
  // 7: STEP TWO — NEW MINUS OLD
  //
  // 23 - 18.5 = 4.5 hours.
  //
  // Show the precise horizontal distance on the hours line.
  // ------------------------------------------------------------

  function contrastPicture(
    y = Y(-0.95),
    withResult = true
  ) {
    const parts = [
      hoursAxis(y),

      meanMarker(
        OLD_MEAN,
        OLD,
        'OLD: 18.5',
        y,
        0.70
      ),

      meanMarker(
        NEW_MEAN,
        NEW,
        'NEW: 23',
        y,
        0.70
      ),

      arrow(
        hx(OLD_MEAN),
        y + 1.35,
        hx(NEW_MEAN),
        y + 1.35,
        GREEN
      ),

      txt(
        '4.5 HOURS',
        (hx(OLD_MEAN) + hx(NEW_MEAN)) / 2,
        y + 1.68,
        GREEN, 22, true
      )
    ];

    if (withResult) {
      parts.push(
        tag(
          '23 − 18.5 = 4.5',
          CX,
          y - 1.10,
          GREEN, 20
        )
      );
    }

    return parts;
  }

  await until(S(7));
  await play(
    ...replace(
      ...contrastPicture()
    ),

    ...fbox([
      'step 2: new minus old',
      '23 − 18.5',
      ['= 4.5 hours', GREEN]
    ], GREEN),

    ...say('STEP 2: THE NEW SUPPLIER IS 4.5 HOURS AHEAD', GREEN)
  );

  // ------------------------------------------------------------
  // WEIGHT CARDS
  //
  // Negative weights subtract.
  // Positive weights add.
  //
  // Absolute weight determines how much a group counts.
  // A and B each contribute half of the old average.
  // ------------------------------------------------------------

  const WEIGHT_TOP = Y(0.65);
  const WEIGHT_MID = Y(-0.59);
  const WEIGHT_BOTTOM = Y(-2.05);

  function weightCard(
    k,
    value,
    y = WEIGHT_MID
  ) {
    const g = groups[k];

    return new M.VGroup(
      outline(
        GX(k),
        y,
        1.75, 1.56,
        g.color, 0.075
      ),

      txt(
        `BATCH ${g.name}`,
        GX(k),
        y + 0.49,
        g.color, 16,
        false, 1.61
      ),

      txt(
        value,
        GX(k),
        y - 0.08,
        g.color, 34, true,
        1.59
      ),

      txt(
        k < 2 ? 'subtract' : 'add',
        GX(k),
        y - 0.54,
        C.muted, 15
      )
    );
  }

  // ------------------------------------------------------------
  // 8: INTRODUCE WEIGHTS AS A RECIPE
  // ------------------------------------------------------------

  const recipeQuestion = tag(
    'A WEIGHT TELLS HOW MUCH TO COUNT',
    CX,
    WEIGHT_TOP,
    VIOLET, 17
  );

  const emptyWeights = groups.map(
    (_, k) => weightCard(k, '?')
  );

  const recipeDirection = new M.VGroup(
    txt(
      '−  subtract',
      CX - 1.48,
      WEIGHT_BOTTOM,
      OLD, 18
    ),

    txt(
      '+  add',
      CX + 1.48,
      WEIGHT_BOTTOM,
      NEW, 18
    )
  );

  await until(S(8));
  await play(
    ...replace(
      recipeQuestion,
      ...emptyWeights,
      recipeDirection
    ),

    ...fbox([
      'a weight tells us',
      'how much a batch counts',
      ['and in which direction', VIOLET]
    ], VIOLET),

    ...say('TURN THE QUESTION INTO A RECIPE', VIOLET)
  );

  // ------------------------------------------------------------
  // 9: A = -1/2, B = -1/2, C = +1
  //
  // Draw the actual amount of each weight using bars
  // on a shared signed scale.
  // ------------------------------------------------------------

  const WB_SCALE = 1.60;

  function signedWeightRow(
    k,
    y
  ) {
    const g = groups[k];

    const width =
      Math.abs(g.weight) * WB_SCALE;

    const center =
      CX + Math.sign(g.weight) * width / 2;

    return new M.VGroup(
      txt(
        `BATCH ${g.name}`,
        CX - 2.18,
        y,
        g.color, 17,
        false, 1.55
      ),

      rect(
        center,
        y,
        width,
        0.43,
        g.color, 0.85
      ),

      txt(
        WEIGHT_LABELS[k],
        CX + 2.18,
        y,
        g.color, 24, true
      )
    );
  }

  const WEIGHT_ROWS = [
    Y(0.66),
    Y(-0.42),
    Y(-1.50)
  ];

  const weightZeroLine = dashed(
    CX,
    WEIGHT_ROWS[2] - 0.37,
    CX,
    WEIGHT_ROWS[0] + 0.48,
    C.muted
  );

  const weightRows = groups.map((_, k) =>
    signedWeightRow(
      k,
      WEIGHT_ROWS[k]
    )
  );

  const weightSignLabels = [
    txt(
      'SUBTRACT',
      CX - 1.02,
      Y(1.32),
      OLD, 15
    ),

    txt(
      'ADD',
      CX + 1.02,
      Y(1.32),
      NEW, 15
    ),

    txt(
      '0',
      CX,
      WEIGHT_ROWS[2] - 0.62,
      C.muted, 15, true
    )
  ];

  await until(S(9));
  await play(
    ...replace(
      weightZeroLine,
      ...weightRows,
      ...weightSignLabels
    ),

    ...fbox([
      ['A weight = −½', BLUE],
      ['B weight = −½', GOLD],
      ['C weight = +1', PINK]
    ]),

    ...say('WEIGHTS: MINUS HALF, MINUS HALF, PLUS ONE')
  );

  // ------------------------------------------------------------
  // 10: MULTIPLY EACH MEAN BY ITS WEIGHT AND ADD
  //
  // -0.5 × 17 = -8.5.
  // -0.5 × 20 = -10.
  // +1 × 23 = +23.
  //
  // -8.5 - 10 + 23 = 4.5.
  // ------------------------------------------------------------

  const MULT_Y = Y(-0.22);

  function weightedMeanTile(k) {
    const g = groups[k];

    const x = GX(k);

    const product =
      g.weightedMean < 0
        ? `−${Math.abs(g.weightedMean)}`
        : `+${g.weightedMean}`;

    return new M.VGroup(
      outline(
        x,
        MULT_Y,
        1.77, 2.48,
        g.color, 0.06
      ),

      txt(
        `BATCH ${g.name}`,
        x,
        MULT_Y + 0.93,
        g.color, 16,
        false, 1.62
      ),

      txt(
        String(g.mean),
        x,
        MULT_Y + 0.47,
        g.color, 25, true
      ),

      txt(
        `× ${WEIGHT_LABELS[k]}`,
        x,
        MULT_Y + 0.02,
        C.muted, 19, true
      ),

      line(
        x - 0.62,
        MULT_Y - 0.30,
        x + 0.62,
        MULT_Y - 0.30,
        g.color, 2
      ),

      txt(
        product,
        x,
        MULT_Y - 0.77,
        g.color, 25, true,
        1.56
      )
    );
  }

  const weightedTiles = groups.map(
    (_, k) => weightedMeanTile(k)
  );

  const weightedSum = tag(
    '−8.5 − 10 + 23 = 4.5',
    CX,
    Y(-2.08),
    GREEN, 21
  );

  await until(S(10));
  await play(
    ...replace(
      ...weightedTiles,
      weightedSum
    ),

    ...fbox([
      '−½ × 17 = −8.5',
      '−½ × 20 = −10',
      '+1 × 23 = +23',
      ['sum = 4.5 hours', GREEN]
    ], GREEN),

    ...say('MULTIPLY BY THE WEIGHTS, THEN ADD', GREEN)
  );

  // ------------------------------------------------------------
  // 11: THE WEIGHTS MUST ADD TO ZERO
  //
  // Two negative half-units cancel one positive full unit.
  //
  // Then demonstrate the rule under a hypothetical common
  // group mean of 20 hours:
  //
  // -0.5 × 20 - 0.5 × 20 + 1 × 20 = 0.
  //
  // These equal means are an illustration of the null,
  // not new chapter measurements.
  // ------------------------------------------------------------

  const BALANCE_Y = Y(-0.50);

  const BAL_UNIT = 2.35;

  function weightBalance() {
    return [
      txt(
        'NEGATIVE WEIGHTS',
        CX - BAL_UNIT / 2,
        BALANCE_Y + 0.91,
        OLD, 16
      ),

      txt(
        'POSITIVE WEIGHT',
        CX + BAL_UNIT / 2,
        BALANCE_Y + 0.91,
        NEW, 16
      ),

      rect(
        CX - 3 * BAL_UNIT / 4,
        BALANCE_Y,
        BAL_UNIT / 2 - 0.025,
        0.66,
        BLUE, 0.84
      ),

      rect(
        CX - BAL_UNIT / 4,
        BALANCE_Y,
        BAL_UNIT / 2 - 0.025,
        0.66,
        GOLD, 0.84
      ),

      rect(
        CX + BAL_UNIT / 2,
        BALANCE_Y,
        BAL_UNIT,
        0.66,
        PINK, 0.84
      ),

      txt(
        '−½',
        CX - 3 * BAL_UNIT / 4,
        BALANCE_Y,
        C.ink, 22, true
      ),

      txt(
        '−½',
        CX - BAL_UNIT / 4,
        BALANCE_Y,
        C.ink, 22, true
      ),

      txt(
        '+1',
        CX + BAL_UNIT / 2,
        BALANCE_Y,
        C.ink, 23, true
      ),

      bracket(
        CX - BAL_UNIT,
        CX,
        BALANCE_Y - 0.53,
        OLD, 0.08
      ),

      bracket(
        CX,
        CX + BAL_UNIT,
        BALANCE_Y - 0.53,
        NEW, 0.08
      ),

      txt(
        '−1',
        CX - BAL_UNIT / 2,
        BALANCE_Y - 0.81,
        OLD, 22, true
      ),

      txt(
        '+1',
        CX + BAL_UNIT / 2,
        BALANCE_Y - 0.81,
        NEW, 22, true
      ),

      tag(
        'TOTAL = 0',
        CX,
        Y(-2.34),
        GREEN, 21
      )
    ];
  }

  await until(S(11));
  await play(
    ...replace(
      ...weightBalance()
    ),

    ...fbox([
      '−½ − ½ + 1',
      ['= 0', GREEN],
      'the contrast rule'
    ], GREEN),

    ...say('THE WEIGHTS MUST ADD TO ZERO', GREEN)
  );

  function nullWeightTile(k) {
    const g = groups[k];

    const v = 20 * g.weight;

    return new M.VGroup(
      outline(
        GX(k),
        Y(-0.44),
        1.77, 1.92,
        g.color, 0.06
      ),

      txt(
        'mean 20',
        GX(k),
        Y(-0.44) + 0.59,
        g.color, 18, true
      ),

      txt(
        `× ${WEIGHT_LABELS[k]}`,
        GX(k),
        Y(-0.44) + 0.11,
        C.muted, 19, true
      ),

      txt(
        v < 0 ? `−${Math.abs(v)}` : `+${v}`,
        GX(k),
        Y(-0.44) - 0.47,
        g.color, 26, true
      )
    );
  }

  const nullIllustration = tag(
    'IMAGINE ALL TRUE MEANS ARE 20',
    CX,
    Y(1.19),
    VIOLET, 16
  );

  const nullTiles = groups.map(
    (_, k) => nullWeightTile(k)
  );

  const nullTotal = tag(
    '−10 − 10 + 20 = 0',
    CX,
    Y(-2.16),
    GREEN, 21
  );

  await until(S(11) + 5.1);
  await play(
    ...replace(
      nullIllustration,
      ...nullTiles,
      nullTotal
    ),

    ...fbox([
      'if every mean is equal',
      'common mean × weight sum',
      ['= common mean × 0 = 0', GREEN]
    ], GREEN),

    ...say('EQUAL MEANS ALWAYS GIVE ZERO', GREEN)
  );

  // ------------------------------------------------------------
  // 12: NAME THE RECIPE — A CONTRAST
  // ------------------------------------------------------------

  function contrastRecipe(
    title = 'CONTRAST',
    planned = false
  ) {
    const topY = Y(0.72);
    const tileY = Y(-0.59);

    const parts = [
      tag(
        title,
        CX,
        topY,
        VIOLET, 22
      )
    ];

    groups.forEach((g, k) => {
      parts.push(
        new M.VGroup(
          outline(
            GX(k),
            tileY,
            1.75, 1.28,
            g.color, 0.08
          ),

          txt(
            `BATCH ${g.name}`,
            GX(k),
            tileY + 0.37,
            g.color, 16
          ),

          txt(
            WEIGHT_LABELS[k],
            GX(k),
            tileY - 0.14,
            g.color, 30, true
          )
        )
      );
    });

    parts.push(
      tag(
        'WEIGHT SUM = 0',
        CX,
        Y(-1.94),
        GREEN, 19
      )
    );

    if (planned) {
      parts.push(
        txt(
          'chosen before seeing the measurements',
          CX,
          Y(-2.49),
          C.muted, 15
        )
      );
    }

    return parts;
  }

  await until(S(12));
  await play(
    ...replace(
      ...contrastRecipe()
    ),

    ...fbox([
      ['contrast', VIOLET],
      'weighted comparison of means',
      ['weights must sum to zero', GREEN]
    ], VIOLET),

    ...say('THIS RECIPE IS CALLED A CONTRAST', VIOLET)
  );

  // ------------------------------------------------------------
  // 13: CHOSEN BEFORE SEEING THE DATA = PLANNED CONTRAST
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...replace(
      ...contrastRecipe(
        'PLANNED CONTRAST',
        true
      )
    ),

    ...fbox([
      'contrast selected',
      'before examining the data',
      ['planned contrast', GREEN]
    ], GREEN),

    ...say('CHOSEN IN ADVANCE: A PLANNED CONTRAST', GREEN)
  );

  // ------------------------------------------------------------
  // 14: IS 4.5 HOURS MORE THAN CHANCE?
  //
  // The contrast is an estimate.
  // It would change if the lab sampled different batteries.
  // Introduce the need for its own standard error.
  // ------------------------------------------------------------

  const WOBBLE_Y = Y(-0.36);

  const wobbleAxis = line(
    CX - 2.75,
    WOBBLE_Y,
    CX + 2.75,
    WOBBLE_Y,
    C.muted, 2.5
  );

  const wobbleCenter = dot(
    CX,
    WOBBLE_Y,
    GREEN, 0.18
  );

  const wobbleLabel = tag(
    'OBSERVED GAP = 4.5',
    CX,
    WOBBLE_Y + 0.77,
    GREEN, 20
  );

  const wobbleQuestion = new M.VGroup(
    arrow(
      CX - 0.28,
      WOBBLE_Y - 0.64,
      CX - 1.57,
      WOBBLE_Y - 0.64,
      VIOLET
    ),

    arrow(
      CX + 0.28,
      WOBBLE_Y - 0.64,
      CX + 1.57,
      WOBBLE_Y - 0.64,
      VIOLET
    ),

    txt(
      'how much can it wobble?',
      CX,
      WOBBLE_Y - 1.17,
      VIOLET, 19
    )
  );

  await until(S(14));
  await play(
    ...replace(
      wobbleAxis,
      wobbleCenter,
      wobbleLabel,
      wobbleQuestion
    ),

    ...fbox([
      ['contrast = 4.5 hours', GREEN],
      'how much sampling wobble?',
      ['need its standard error', VIOLET]
    ], VIOLET),

    ...say('IS FOUR AND A HALF MORE THAN CHANCE?', VIOLET)
  );

  // ------------------------------------------------------------
  // 15: BORROW THE WITHIN-BATCH VARIANCE FROM ANOVA
  //
  // The pooled within sum of squares:
  // A = 8, B = 8, C = 20.
  //
  // Total = 36.
  // Within df = 9.
  // Within mean square = 4.
  //
  // All twelve batteries contribute to this estimate.
  // ------------------------------------------------------------

  const POOL_TOP = Y(0.95);
  const POOL_Y = Y(-0.76);
  const POOL_BOTTOM = Y(-2.28);

  const poolParts = [
    outline(
      CX,
      POOL_Y,
      5.42, 1.51,
      GREEN, 0.055
    )
  ];

  groups.forEach((g, k) => {
    poolParts.push(
      tag(
        `${g.name}: ${g.ss}`,
        GX(k),
        POOL_TOP,
        g.color, 18
      ),

      arrow(
        GX(k),
        POOL_TOP - 0.30,
        CX + (k - 1) * 1.53,
        POOL_Y + 0.82,
        g.color,
        0.12
      )
    );
  });

  const POOL_COLS = 12;
  const POOL_PITCH = 0.35;

  let poolIndex = 0;

  groups.forEach(g => {
    for (let j = 0; j < g.ss; j++) {
      const row =
        Math.floor(poolIndex / POOL_COLS);

      const col =
        poolIndex % POOL_COLS;

      poolParts.push(
        rect(
          CX + (col - 5.5) * POOL_PITCH,
          POOL_Y + (1 - row) * POOL_PITCH,
          POOL_PITCH * 0.85,
          POOL_PITCH * 0.85,
          g.color, 0.87
        )
      );

      poolIndex++;
    }
  });

  const pooledVariance = tag(
    'WITHIN MS = 36 ÷ 9 = 4',
    CX,
    POOL_BOTTOM,
    GREEN, 20
  );

  await until(S(15));
  await play(
    ...replace(
      ...poolParts,
      pooledVariance
    ),

    ...fbox([
      'within SS = 8 + 8 + 20 = 36',
      'within df = 12 − 3 = 9',
      ['pooled variance = 4', GREEN]
    ], GREEN),

    ...say('BORROW ANOVA’S POOLED VARIANCE: FOUR', GREEN)
  );

  // ------------------------------------------------------------
  // 16: SQUARE EACH WEIGHT
  //
  // (-1/2)^2 = 1/4.
  // (-1/2)^2 = 1/4.
  // (+1)^2 = 1.
  //
  // Use square areas, with actual side lengths in the
  // ratio 1/2 : 1/2 : 1.
  //
  // This makes it visually clear why a half-weight produces
  // one quarter of the variance contribution.
  // ------------------------------------------------------------

  const WSQ_BASE = Y(-1.43);
  const WSQ_UNIT = P ? 1.48 : 1.34;

  function squaredWeightPicture() {
    const parts = [];

    groups.forEach((g, k) => {
      const x = GX(k);

      const side =
        Math.abs(g.weight) * WSQ_UNIT;

      parts.push(
        tag(
          `BATCH ${g.name}`,
          x,
          Y(1.16),
          g.color, 16,
          1.80
        ),

        txt(
          `(${WEIGHT_LABELS[k]})²`,
          x,
          Y(0.61),
          g.color, 23, true,
          1.77
        ),

        rect(
          x,
          WSQ_BASE + side / 2,
          side,
          side,
          g.color, 0.77, 2
        ),

        txt(
          SQUARED_LABELS[k],
          x,
          WSQ_BASE - 0.43,
          g.color, 27, true
        )
      );

      if (k === 2) {
        parts.push(
          line(
            x,
            WSQ_BASE,
            x,
            WSQ_BASE + side,
            C.card, 2
          ),

          line(
            x - side / 2,
            WSQ_BASE + side / 2,
            x + side / 2,
            WSQ_BASE + side / 2,
            C.card, 2
          )
        );
      }
    });

    parts.push(
      line(
        CX - 3.00,
        WSQ_BASE,
        CX + 3.00,
        WSQ_BASE,
        C.muted, 1.5
      ),

      tag(
        'SQUARED WEIGHTS: ALL POSITIVE',
        CX,
        Y(-2.47),
        VIOLET, 16
      )
    );

    return parts;
  }

  await until(S(16));
  await play(
    ...replace(
      ...squaredWeightPicture()
    ),

    ...fbox([
      ['(−½)² = ¼', BLUE],
      ['(−½)² = ¼', GOLD],
      ['(+1)² = 1', PINK]
    ]),

    ...say('SQUARE EACH WEIGHT', VIOLET)
  );

  // ------------------------------------------------------------
  // 17: DIVIDE EACH SQUARED WEIGHT BY ITS GROUP SIZE
  //
  // All groups contain four batteries.
  //
  // A: (1/4) / 4 = 1/16.
  // B: (1/4) / 4 = 1/16.
  // C: 1 / 4 = 1/4 = 4/16.
  //
  // Visual: each full square contains sixteen equal cells.
  // One cell represents one sixteenth.
  // ------------------------------------------------------------

  function fractionGrid(
    x, y,
    filled,
    color,
    pitch = 0.29
  ) {
    const parts = [];

    for (let k = 0; k < 16; k++) {
      const row = Math.floor(k / 4);
      const col = k % 4;

      parts.push(
        rect(
          x + (col - 1.5) * pitch,
          y + (1.5 - row) * pitch,
          pitch * 0.87,
          pitch * 0.87,
          k < filled ? color : C.muted,
          k < filled ? 0.86 : 0.055,
          k < filled ? 1 : 0.8
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const FRACTION_Y = Y(-0.57);

  function contributionGrid(k) {
    const g = groups[k];

    const x = GX(k);

    const units =
      Math.round(16 * g.contribution);

    return new M.VGroup(
      txt(
        `BATCH ${g.name}`,
        x,
        Y(1.17),
        g.color, 16
      ),

      txt(
        `${SQUARED_LABELS[k]} ÷ 4`,
        x,
        Y(0.64),
        g.color, 21, true
      ),

      fractionGrid(
        x,
        FRACTION_Y,
        units,
        g.color,
        0.30
      ),

      txt(
        TERM_LABELS[k],
        x,
        FRACTION_Y - 0.89,
        g.color, 22, true
      )
    );
  }

  const contributionGrids =
    groups.map((_, k) =>
      contributionGrid(k)
    );

  const fractionInstruction = txt(
    'each small square = 1/16',
    CX,
    Y(-2.32),
    C.muted, 16
  );

  await until(S(17));
  await play(
    ...replace(
      ...contributionGrids,
      fractionInstruction
    ),

    ...fbox([
      ['A: ¼ ÷ 4 = 1/16', BLUE],
      ['B: ¼ ÷ 4 = 1/16', GOLD],
      ['C: 1 ÷ 4 = 1/4', PINK]
    ]),

    ...say('DIVIDE EACH SQUARED WEIGHT BY FOUR')
  );

  // Combine six of the sixteen cells:
  // one cyan, one amber, four pink.

  const TOTAL_GRID_Y = Y(-0.52);

  const TOTAL_GRID_PITCH = P ? 0.65 : 0.56;

  const totalFractionCells = [];

  const fillColors = [
    BLUE,
    GOLD,
    PINK,
    PINK,
    PINK,
    PINK
  ];

  for (let k = 0; k < 16; k++) {
    const row = Math.floor(k / 4);
    const col = k % 4;

    totalFractionCells.push(
      rect(
        CX + (col - 1.5) * TOTAL_GRID_PITCH,
        TOTAL_GRID_Y +
          (1.5 - row) * TOTAL_GRID_PITCH,
        TOTAL_GRID_PITCH * 0.87,
        TOTAL_GRID_PITCH * 0.87,
        k < 6 ? fillColors[k] : C.muted,
        k < 6 ? 0.86 : 0.045,
        1
      )
    );
  }

  const totalFractionTitle = txt(
    '1/16 + 1/16 + 4/16',
    CX,
    Y(1.31),
    VIOLET, 21, true
  );

  const totalFractionResult = tag(
    '6/16 = 3/8',
    CX,
    Y(-2.25),
    GREEN, 23
  );

  await until(S(17) + 4.3);
  await play(
    ...replace(
      totalFractionTitle,
      ...totalFractionCells,
      totalFractionResult
    ),

    ...fbox([
      '1/16 + 1/16 + 1/4',
      '= 6/16',
      ['= 3/8', GREEN]
    ], GREEN),

    ...say('ADD THE THREE PIECES: THREE EIGHTHS', GREEN)
  );

  // ------------------------------------------------------------
  // 18: MULTIPLY THREE EIGHTHS BY THE POOLED VARIANCE FOUR
  //
  // 3/8 × 4 = 12/8 = 1.5.
  //
  // Show four equal bars, each with eight cells and three
  // filled cells. Together there are twelve eighths.
  // ------------------------------------------------------------

  const EIGHTH_PITCH = 0.54;

  const MULTIPLY_ROWS = [
    Y(0.83),
    Y(-0.01),
    Y(-0.85),
    Y(-1.69)
  ];

  function eighthBar(y, index) {
    const parts = [
      txt(
        String(index + 1),
        CX - 2.65,
        y,
        C.muted, 15, true
      )
    ];

    for (let k = 0; k < 8; k++) {
      parts.push(
        rect(
          CX + (k - 3.5) * EIGHTH_PITCH,
          y,
          EIGHTH_PITCH * 0.86,
          0.43,
          k < 3 ? VIOLET : C.muted,
          k < 3 ? 0.85 : 0.04,
          1
        )
      );
    }

    parts.push(
      txt(
        '3/8',
        CX + 2.67,
        y,
        VIOLET, 16, true
      )
    );

    return new M.VGroup(...parts);
  }

  const eighthRows =
    MULTIPLY_ROWS.map((y, k) =>
      eighthBar(y, k)
    );

  const multipliedResult = tag(
    '12/8 = 1.5 HOURS²',
    CX,
    Y(-2.46),
    GREEN, 20
  );

  await until(S(18));
  await play(
    ...replace(
      ...eighthRows,
      multipliedResult
    ),

    ...fbox([
      'squared standard error',
      '4 × 3/8 = 12/8',
      ['= 1.5 hours²', VIOLET]
    ], VIOLET),

    ...say('THREE EIGHTHS TIMES FOUR IS ONE AND A HALF')
  );

  // ------------------------------------------------------------
  // 19: TAKE THE SQUARE ROOT
  //
  // Draw a square whose area is proportional to 1.5.
  // Its side length is proportional to sqrt(1.5).
  //
  // This changes squared hours back into ordinary hours.
  // ------------------------------------------------------------

  const ROOT_Y = Y(-0.32);

  const ROOT_SCALE = P ? 1.78 : 1.45;

  const ROOT_SIDE = SE * ROOT_SCALE;

  const rootSquare = rect(
    CX,
    ROOT_Y,
    ROOT_SIDE,
    ROOT_SIDE,
    VIOLET, 0.70, 2
  );

  const rootAreaText = txt(
    'AREA = 1.5',
    CX,
    ROOT_Y,
    C.ink, 21, true,
    ROOT_SIDE - 0.13
  );

  const rootTopText = txt(
    'SQUARE ROOT',
    CX,
    ROOT_Y + ROOT_SIDE / 2 + 0.36,
    VIOLET, 18
  );

  const rootBracketY =
    ROOT_Y - ROOT_SIDE / 2 - 0.28;

  const rootBracket = bracket(
    CX - ROOT_SIDE / 2,
    CX + ROOT_SIDE / 2,
    rootBracketY,
    GREEN,
    0.09
  );

  const rootValue = tag(
    'SE ≈ 1.22 HOURS',
    CX,
    rootBracketY - 0.39,
    GREEN, 20
  );

  await until(S(19));
  await play(
    ...replace(
      rootSquare,
      rootAreaText,
      rootTopText,
      rootBracket,
      rootValue
    ),

    ...fbox([
      'SE = √1.5',
      ['≈ 1.22 hours', GREEN],
      'about 1.2 hours'
    ], GREEN),

    ...say('TAKE THE SQUARE ROOT TO GET THE STANDARD ERROR', GREEN)
  );

  // ------------------------------------------------------------
  // 20: t = CONTRAST / STANDARD ERROR
  //
  // 4.5 / sqrt(1.5) = 3.674...
  //
  // Represent the contrast as a ruler containing
  // three full standard errors and 0.674 of another.
  // ------------------------------------------------------------

  const RULER_W = P ? 5.95 : 6.10;

  const RULER_LEFT = CX - RULER_W / 2;
  const RULER_RIGHT = CX + RULER_W / 2;

  const RULER_Y = Y(-0.62);

  const SE_UNIT_W =
    RULER_W * SE / CONTRAST;

  const FULL_UNITS =
    Math.floor(TSTAT);

  const LAST_FRACTION =
    TSTAT - FULL_UNITS;

  function contrastRuler() {
    const parts = [
      bracket(
        RULER_LEFT,
        RULER_RIGHT,
        RULER_Y + 1.04,
        GREEN
      ),

      txt(
        'OBSERVED GAP: 4.5 HOURS',
        CX,
        RULER_Y + 1.38,
        GREEN, 20, true
      ),

      arrow(
        RULER_LEFT,
        RULER_Y + 0.48,
        RULER_RIGHT,
        RULER_Y + 0.48,
        GOLD
      )
    ];

    let cursor = RULER_LEFT;

    for (let k = 0; k <= FULL_UNITS; k++) {
      const amount =
        k < FULL_UNITS ? 1 : LAST_FRACTION;

      const width =
        SE_UNIT_W * amount;

      const x =
        cursor + width / 2;

      parts.push(
        rect(
          x,
          RULER_Y - 0.02,
          width - 0.035,
          0.62,
          VIOLET,
          k < FULL_UNITS ? 0.86 : 0.47
        ),

        txt(
          k < FULL_UNITS ? '1 SE' : '0.67',
          x,
          RULER_Y - 0.02,
          C.ink, 17, true,
          width - 0.10
        )
      );

      cursor += width;
    }

    parts.push(
      txt(
        'each SE ≈ 1.22 hours',
        CX,
        RULER_Y - 0.68,
        C.muted, 17
      ),

      tag(
        't ≈ 3.67',
        CX,
        RULER_Y - 1.28,
        VIOLET, 24
      )
    );

    return parts;
  }

  await until(S(20));
  await play(
    ...replace(
      ...contrastRuler()
    ),

    ...fbox([
      't = contrast ÷ SE',
      '  = 4.5 ÷ √1.5',
      ['  ≈ 3.67', VIOLET]
    ], VIOLET),

    ...say('THE GAP IS ABOUT 3.7 STANDARD ERRORS', VIOLET)
  );

  // ------------------------------------------------------------
  // 21: BORROW NINE WITHIN-BATCH df FROM ANOVA
  //
  // Four observations per group.
  // Estimate one mean per group.
  //
  // 3 + 3 + 3 = 9 within degrees of freedom.
  // ------------------------------------------------------------

  function dfBatch(k) {
    const g = groups[k];

    const x = GX(k);
    const y = Y(-0.44);

    const parts = [
      outline(
        x, y,
        1.79, 1.64,
        g.color, 0.05
      ),

      txt(
        `BATCH ${g.name}`,
        x,
        y + 0.54,
        g.color, 16,
        false, 1.65
      )
    ];

    for (let j = 0; j < 4; j++) {
      const xx =
        x + (j - 1.5) * 0.38;

      parts.push(
        rect(
          xx,
          y,
          0.33, 0.43,
          j < 3 ? g.color : C.muted,
          j < 3 ? 0.75 : 0.055
        ),

        txt(
          j < 3 ? '1' : '×',
          xx,
          y,
          j < 3 ? C.ink : C.muted,
          15, true
        )
      );
    }

    parts.push(
      txt(
        '4 − 1 = 3',
        x,
        y - 0.56,
        g.color, 17, true,
        1.65
      )
    );

    return new M.VGroup(...parts);
  }

  const dfGroups =
    groups.map((_, k) =>
      dfBatch(k)
    );

  const dfTitle = tag(
    'WITHIN-BATCH DEGREES OF FREEDOM',
    CX,
    Y(1.15),
    GREEN, 16
  );

  const dfResult = tag(
    '3 + 3 + 3 = 9 df',
    CX,
    Y(-2.12),
    GREEN, 22
  );

  await until(S(21));
  await play(
    ...replace(
      dfTitle,
      ...dfGroups,
      dfResult
    ),

    ...fbox([
      'borrow the within df',
      '12 batteries − 3 means',
      ['df = 9', GREEN]
    ], GREEN),

    ...say('USE THE NINE WITHIN-BATCH df', GREEN)
  );

  // ------------------------------------------------------------
  // 22: ONE PLANNED QUESTION NEEDS NO EXTRA MULTIPLICITY
  // CORRECTION
  //
  // This is one prespecified contrast treated as one test.
  // It is not selected after inspecting ANOVA or the means.
  // Multiple planned tests could still require adjustment.
  // ------------------------------------------------------------

  const singleTestY = Y(-0.44);

  const singlePlan = notebook(
    CX - 1.80,
    singleTestY,
    VIOLET
  );

  const singleTest = new M.VGroup(
    outline(
      CX + 1.65,
      singleTestY,
      2.22, 1.72,
      GREEN, 0.075
    ),

    txt(
      'ONE TEST',
      CX + 1.65,
      singleTestY + 0.50,
      GREEN, 18
    ),

    txt(
      'α = 0.05',
      CX + 1.65,
      singleTestY - 0.04,
      GREEN, 23, true
    ),

    checkMark(
      CX + 1.65,
      singleTestY - 0.54,
      GREEN
    )
  );

  const singleTestArrow = arrow(
    CX - 0.98,
    singleTestY,
    CX + 0.45,
    singleTestY,
    GREEN
  );

  const singleTestCaption = tag(
    'ONE QUESTION → ONE TEST',
    CX,
    Y(-2.12),
    GREEN, 19
  );

  await until(S(22));
  await play(
    ...replace(
      singlePlan,
      singleTestArrow,
      singleTest,
      singleTestCaption
    ),

    ...fbox([
      'one prespecified contrast',
      'one statistical test',
      ['no extra multiplicity correction', GREEN]
    ], GREEN),

    ...say('ONE PLANNED QUESTION NEEDS NO EXTRA CORRECTION', GREEN)
  );

  // ------------------------------------------------------------
  // STUDENT t REFERENCE DISTRIBUTION
  //
  // For df = 9:
  //
  // f(t) = [128 / (105π)] × (1 + t²/9)^(-5).
  //
  // The graph uses the exact mathematical density.
  // The two-sided p-value is calculated numerically using
  // Simpson integration after the substitution t = tan(theta).
  // This includes both infinite tails.
  // ------------------------------------------------------------

  function tPDF(v) {
    return (
      128 / (105 * Math.PI)
    ) *
      Math.pow(
        1 + v * v / 9,
        -5
      );
  }

  function tUpperTail(value) {
    const a = Math.atan(value);
    const b = Math.PI / 2;

    const steps = 2048;
    const h = (b - a) / steps;

    function transformedDensity(theta) {
      if (
        theta >= Math.PI / 2 - 1e-12
      ) {
        return 0;
      }

      const x = Math.tan(theta);

      return tPDF(x) *
        (1 + x * x);
    }

    let result =
      transformedDensity(a) +
      transformedDensity(b);

    for (let k = 1; k < steps; k++) {
      result +=
        (k % 2 === 0 ? 2 : 4) *
        transformedDensity(a + k * h);
    }

    return result * h / 3;
  }

  const PVALUE =
    2 * tUpperTail(Math.abs(TSTAT));

  const TMIN = -6;
  const TMAX = 6;

  const TW = P ? 6.30 : 6.48;

  const TY = Y(-1.91);

  const TSCALE =
    P ? 8.30 : 6.15;

  const tx = v =>
    CX - TW / 2 +
    (v - TMIN) /
      (TMAX - TMIN) *
      TW;

  const ty = v =>
    TY + tPDF(v) * TSCALE;

  function tAxis() {
    const parts = [
      line(
        tx(TMIN), TY,
        tx(TMAX), TY,
        C.muted, 2.6
      )
    ];

    for (let v = TMIN; v <= TMAX; v++) {
      parts.push(
        line(
          tx(v), TY - 0.065,
          tx(v), TY + 0.065,
          C.muted, 1.3
        ),

        txt(
          v < 0
            ? `−${Math.abs(v)}`
            : String(v),
          tx(v),
          TY - 0.28,
          C.muted, 15, true,
          0.46
        )
      );
    }

    parts.push(
      txt(
        't statistic',
        CX,
        TY - 0.72,
        C.muted, 16
      )
    );

    return new M.VGroup(...parts);
  }

  function tCurve(
    color = BLUE,
    samples = 160
  ) {
    const parts = [];

    for (let k = 0; k < samples; k++) {
      const a =
        TMIN +
        (TMAX - TMIN) * k / samples;

      const b =
        TMIN +
        (TMAX - TMIN) * (k + 1) / samples;

      parts.push(
        line(
          tx(a), ty(a),
          tx(b), ty(b),
          color, 3.1
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function tailArea(
    lo,
    hi,
    color = VIOLET,
    samples = 65
  ) {
    const parts = [];

    const dx =
      (hi - lo) / samples;

    for (let k = 0; k < samples; k++) {
      const a = lo + k * dx;
      const b = a + dx;
      const mid = (a + b) / 2;

      const h = Math.max(
        0.001,
        tPDF(mid) * TSCALE
      );

      parts.push(
        rect(
          tx(mid),
          TY + h / 2,
          tx(b) - tx(a) + 0.001,
          h,
          color,
          0.83,
          0
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function tMarker(
    value,
    color,
    label,
    height
  ) {
    return new M.VGroup(
      dashed(
        tx(value),
        TY,
        tx(value),
        TY + height,
        color
      ),

      dot(
        tx(value),
        TY,
        color, 0.11
      ),

      tag(
        label,
        tx(value),
        TY + height + 0.30,
        color, 18,
        1.55
      )
    );
  }

  function contrastTestPicture(
    withP = true
  ) {
    const parts = [
      tAxis(),

      tailArea(
        TMIN,
        -TSTAT,
        VIOLET
      ),

      tailArea(
        TSTAT,
        TMAX,
        VIOLET
      ),

      tCurve(),

      tMarker(
        -TSTAT,
        VIOLET,
        '−3.67',
        P ? 1.83 : 1.36
      ),

      tMarker(
        TSTAT,
        GOLD,
        '+3.67',
        P ? 1.83 : 1.36
      ),

      tag(
        't DISTRIBUTION: 9 df',
        CX,
        Y(1.34),
        BLUE, 17
      ),

      arrow(
        tx(-5.30),
        TY + 0.075,
        tx(-6),
        TY + 0.075,
        VIOLET, 0.10
      ),

      arrow(
        tx(5.30),
        TY + 0.075,
        tx(6),
        TY + 0.075,
        VIOLET, 0.10
      )
    ];

    if (withP) {
      parts.push(
        tag(
          `p ≈ ${(PVALUE * 100).toFixed(2)}%`,
          P ? CX - 1.5 : CX,
          TY - 1.15,
          VIOLET, 21
        )
      );
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 23: p IS ABOUT HALF A PERCENT
  //
  // The supplied lesson uses the two-sided contrast test.
  //
  // Under the null, the probability of observing a t statistic
  // at least as extreme in either direction is about 0.5%.
  //
  // This is not the probability that the null is true.
  //
  // Because the observed contrast is positive, the result
  // provides strong evidence that C exceeds the old average.
  // ------------------------------------------------------------

  const testPicture =
    contrastTestPicture(true);

  await until(S(23));
  await play(
    ...replace(
      ...testPicture
    ),

    ...fbox([
      't ≈ 3.67; df = 9',
      `two-sided p ≈ ${PVALUE.toFixed(4)}`,
      ['about 0.5%', GREEN]
    ], GREEN),

    ...say('A p-VALUE OF ABOUT HALF A PERCENT', GREEN)
  );

  const rejectNullTag = tag(
    'REJECT THE NULL',
    P ? CX + 1.4 : CX,
    TY - (P ? 1.15 : 1.75),
    GREEN, 19
  );

  await until(S(23) + 3.4);
  await play(
    ...add(rejectNullTag),

    ...fbox([
      'p ≈ 0.5% < 5%',
      ['reject zero contrast', GREEN],
      'evidence new > old average'
    ], GREEN),

    ...say('STRONG EVIDENCE THE NEW SUPPLIER LASTS LONGER', GREEN)
  );

  // ------------------------------------------------------------
  // 24: FORMULA FOR A CONTRAST
  //
  // L = sum(w_i × mean_i).
  //
  // Use L only in the displayed formula as the contrast label.
  // The engine parameter L remains untouched.
  // ------------------------------------------------------------

  const FORM_TILE_Y = Y(-0.26);

  function contrastFormulaTile(k) {
    const g = groups[k];

    return new M.VGroup(
      outline(
        GX(k),
        FORM_TILE_Y,
        1.77, 2.03,
        g.color, 0.065
      ),

      txt(
        `BATCH ${g.name}`,
        GX(k),
        FORM_TILE_Y + 0.69,
        g.color, 16
      ),

      txt(
        WEIGHT_LABELS[k],
        GX(k),
        FORM_TILE_Y + 0.20,
        g.color, 26, true
      ),

      txt(
        '×',
        GX(k),
        FORM_TILE_Y - 0.19,
        C.muted, 18
      ),

      txt(
        String(g.mean),
        GX(k),
        FORM_TILE_Y - 0.65,
        g.color, 25, true
      )
    );
  }

  const formulaTiles = groups.map(
    (_, k) => contrastFormulaTile(k)
  );

  const formulaContrast = tag(
    'CONTRAST = 4.5',
    CX,
    Y(-2.20),
    GREEN, 22
  );

  await until(S(24));
  await play(
    ...replace(
      ...formulaTiles,
      formulaContrast
    ),

    ...fbox([
      'contrast = Σ(weight × mean)',
      'Σ means add them all',
      ['weights sum to zero', GREEN]
    ], VIOLET),

    ...say('CONTRAST = SUM OF WEIGHT TIMES MEAN', VIOLET)
  );

  // ------------------------------------------------------------
  // 25: t = CONTRAST / ITS STANDARD ERROR
  //
  // Explicitly retain the standard-error formula:
  //
  // SE = sqrt(MSE × sum(w_i² / n_i)).
  // ------------------------------------------------------------

  const TFORM_TOP = Y(0.72);
  const TFORM_BOTTOM = Y(-0.88);

  function fractionCard(
    y,
    title,
    value,
    color
  ) {
    return new M.VGroup(
      outline(
        CX,
        y,
        5.53, 1.12,
        color, 0.065
      ),

      txt(
        title,
        CX,
        y + 0.28,
        color, 17,
        false, 5.20
      ),

      txt(
        value,
        CX,
        y - 0.19,
        color, 27, true
      )
    );
  }

  const contrastNumerator = fractionCard(
    TFORM_TOP,
    'OBSERVED CONTRAST',
    '4.5 hours',
    GREEN
  );

  const contrastDenominator = fractionCard(
    TFORM_BOTTOM,
    'STANDARD ERROR',
    '√1.5 ≈ 1.22',
    VIOLET
  );

  const tFractionLine = line(
    CX - 2.83,
    (TFORM_TOP + TFORM_BOTTOM) / 2,
    CX + 2.83,
    (TFORM_TOP + TFORM_BOTTOM) / 2,
    C.ink, 3
  );

  const tFormulaResult = tag(
    't ≈ 3.67',
    CX,
    Y(-2.26),
    VIOLET, 23
  );

  await until(S(25));
  await play(
    ...replace(
      contrastNumerator,
      contrastDenominator,
      tFractionLine,
      tFormulaResult
    ),

    ...fbox([
      't = contrast / SE',
      'SE = √(MSE × Σ(w²/n))',
      ['t ≈ 3.67; df = 9', VIOLET]
    ], VIOLET),

    ...say('DIVIDE THE CONTRAST BY ITS OWN STANDARD ERROR', VIOLET)
  );

  // ------------------------------------------------------------
  // 26: ONE PLANNED COMPARISON, MEASURED IN ITS OWN WOBBLE
  // ------------------------------------------------------------

  await until(S(26));
  await play(
    ...replace(
      ...contrastRuler()
    ),

    ...fbox([
      ['one planned comparison', GREEN],
      'measured in units of',
      ['its own sampling wobble', VIOLET]
    ], VIOLET),

    ...say('ONE QUESTION, MEASURED IN ITS OWN WOBBLE')
  );

  // ------------------------------------------------------------
  // 27: WHAT IS A PLANNED CONTRAST FOR?
  //
  // A planned contrast concentrates on a scientifically
  // meaningful question instead of testing every possible gap.
  //
  // Under the appropriate model, this focused test can have
  // more power for the specific alternative of interest.
  //
  // Do not invent a numerical power comparison.
  // ------------------------------------------------------------

  const FOCUS_Y = Y(-0.32);

  function targetIcon(
    x, y,
    color = GREEN
  ) {
    const parts = [];

    [0.65, 0.44, 0.22].forEach(radius => {
      const ring = new M.Circle({
        radius,
        color,
        strokeWidth: 2.3
      });

      ring.setFill(color, 0.025);
      ring.moveTo(pt(x, y));

      parts.push(ring);
    });

    parts.push(
      dot(x, y, color, 0.10)
    );

    return new M.VGroup(...parts);
  }

  const focusedCard = new M.VGroup(
    outline(
      CX - 1.64,
      FOCUS_Y,
      2.79, 2.53,
      GREEN, 0.045
    ),

    txt(
      'FOCUSED QUESTION',
      CX - 1.64,
      FOCUS_Y + 0.97,
      GREEN, 16,
      false, 2.58
    ),

    targetIcon(
      CX - 1.64,
      FOCUS_Y - 0.03,
      GREEN
    ),

    txt(
      'new vs old average',
      CX - 1.64,
      FOCUS_Y - 0.97,
      GREEN, 15,
      false, 2.57
    )
  );

  const broadCardParts = [
    outline(
      CX + 1.64,
      FOCUS_Y,
      2.79, 2.53,
      C.muted, 0.035
    ),

    txt(
      'MANY POSSIBLE GAPS',
      CX + 1.64,
      FOCUS_Y + 0.97,
      C.muted, 16,
      false, 2.58
    )
  ];

  const smallTargetPositions = [
    [-0.57, 0.30],
    [0.57, 0.30],
    [0, -0.48]
  ];

  smallTargetPositions.forEach(([dx, dy]) => {
    const ring = new M.Circle({
      radius: 0.32,
      color: C.muted,
      strokeWidth: 2
    });

    ring.setFill(C.muted, 0.04);

    ring.moveTo(
      pt(
        CX + 1.64 + dx,
        FOCUS_Y + dy
      )
    );

    broadCardParts.push(
      ring,

      dot(
        CX + 1.64 + dx,
        FOCUS_Y + dy,
        C.muted,
        0.065
      )
    );
  });

  const broadCard =
    new M.VGroup(...broadCardParts);

  const powerCaption = tag(
    'POWER = CHANCE TO CATCH A REAL GAP',
    CX,
    Y(-2.29),
    GREEN, 16
  );

  await until(S(27));
  await play(
    ...replace(
      focusedCard,
      broadCard,
      powerCaption
    ),

    ...fbox([
      'test the exact question',
      'a focused planned contrast',
      ['can improve statistical power', GREEN]
    ], GREEN),

    ...say('FOCUS ON THE DIFFERENCE YOU ACTUALLY CARE ABOUT', GREEN)
  );

  // ------------------------------------------------------------
  // 28: TRAP — THE CONTRAST MUST BE PLANNED BEFORE LOOKING
  // ------------------------------------------------------------

  const TRAP_Y = Y(-0.37);

  function orderCard(
    x, y,
    good
  ) {
    const color =
      good ? GREEN : GOLD;

    const steps = good
      ? ['PLAN', 'DATA', 'TEST']
      : ['DATA', 'PICK', 'TEST'];

    const parts = [
      outline(
        x,
        y,
        2.81, 2.72,
        color, 0.045
      ),

      txt(
        good ? 'PLANNED' : 'DATA-DRIVEN',
        x,
        y + 1.05,
        color, 18
      )
    ];

    steps.forEach((s, k) => {
      const yy =
        y + 0.43 - k * 0.63;

      parts.push(
        outline(
          x,
          yy,
          1.67, 0.43,
          k === 1 && !good
            ? GOLD
            : C.muted,
          0.055
        ),

        txt(
          s,
          x,
          yy,
          color, 16, true
        )
      );

      if (k < 2) {
        parts.push(
          txt(
            '↓',
            x,
            yy - 0.315,
            C.muted, 13
          )
        );
      }
    });

    parts.push(
      good
        ? checkMark(x + 1.05, y - 0.94)
        : crossMark(x + 1.05, y - 0.94)
    );

    return new M.VGroup(...parts);
  }

  const plannedOrder = orderCard(
    CX - 1.65,
    TRAP_Y,
    true
  );

  const dataDrivenOrder = orderCard(
    CX + 1.65,
    TRAP_Y,
    false
  );

  const trapOrderCaption = tag(
    'THE ORDER MATTERS',
    CX,
    Y(-2.32),
    GOLD, 20
  );

  await until(S(28));
  await play(
    ...replace(
      plannedOrder,
      dataDrivenOrder,
      trapOrderCaption
    ),

    ...fbox([
      ['plan before looking', GREEN],
      'not after seeing data',
      ['or correct for it', GOLD]
    ], GOLD),

    ...say('TRAP: YOU MUST CHOOSE THE CONTRAST FIRST', GOLD)
  );

  // ------------------------------------------------------------
  // 29: PICKING THE BIGGEST GAP MAKES THE UNADJUSTED
  // p-VALUE TOO OPTIMISTIC
  //
  // Use the observed chapter means:
  // B - A = 3.
  // C - A = 6.
  // C - B = 3.
  //
  // These are candidate comparisons, not pairwise conclusions.
  // Selecting C-A because it looks largest is data-dependent.
  // ------------------------------------------------------------

  const SEARCH_TOP = Y(0.75);
  const SEARCH_MID = Y(-0.33);
  const SEARCH_BOTTOM = Y(-1.41);

  const SEARCH_LEFT = CX - 1.39;

  const SEARCH_SCALE = 0.60;

  function candidateGap(
    y,
    label,
    gap,
    color
  ) {
    const width =
      gap * SEARCH_SCALE;

    return new M.VGroup(
      txt(
        label,
        CX - 2.35,
        y,
        color, 18,
        false, 1.45
      ),

      rect(
        SEARCH_LEFT + width / 2,
        y,
        width,
        0.44,
        color, 0.79
      ),

      txt(
        `${gap} h`,
        CX + 2.67,
        y,
        color, 18, true,
        0.85
      )
    );
  }

  const gapAB = candidateGap(
    SEARCH_TOP,
    'B − A',
    3,
    BLUE
  );

  const gapAC = candidateGap(
    SEARCH_MID,
    'C − A',
    6,
    PINK
  );

  const gapBC = candidateGap(
    SEARCH_BOTTOM,
    'C − B',
    3,
    GOLD
  );

  const chosenGapOutline = outline(
    CX,
    SEARCH_MID,
    6.12, 0.76,
    GOLD,
    0.035
  );

  const cherryPickTag = tag(
    'PICKED BECAUSE IT LOOKS BIGGEST',
    CX,
    Y(-2.40),
    GOLD, 16
  );

  await until(S(29));
  await play(
    ...replace(
      gapAB,
      gapAC,
      gapBC,
      chosenGapOutline,
      cherryPickTag
    ),

    ...fbox([
      'look at many possible gaps',
      'select the largest-looking one',
      ['ordinary p is too optimistic', GOLD]
    ], GOLD),

    ...say('DO NOT SEARCH THE DATA AND THEN PRETEND IT WAS PLANNED', GOLD)
  );

  // ------------------------------------------------------------
  // 30: QUESTIONS CHOSEN AFTER LOOKING NEED A CORRECTION
  //
  // Introduce the next lesson without solving its comparisons.
  //
  // Tukey's procedure will address all three pairwise
  // comparisons in this example.
  // ------------------------------------------------------------

  const MULTI_Y = Y(0.45);

  function comparisonChip(
    x, y,
    label,
    color
  ) {
    return new M.VGroup(
      outline(
        x,
        y,
        1.73, 0.89,
        color, 0.07
      ),

      txt(
        label,
        x,
        y,
        color, 20, true
      )
    );
  }

  const multiAB = comparisonChip(
    GX(0),
    MULTI_Y,
    'B − A',
    BLUE
  );

  const multiAC = comparisonChip(
    GX(1),
    MULTI_Y,
    'C − A',
    PINK
  );

  const multiBC = comparisonChip(
    GX(2),
    MULTI_Y,
    'C − B',
    GOLD
  );

  const correctionY = Y(-1.22);

  const correctionBox = new M.VGroup(
    outline(
      CX,
      correctionY,
      5.51, 1.13,
      VIOLET, 0.08
    ),

    txt(
      'MULTIPLE-COMPARISON CORRECTION',
      CX,
      correctionY + 0.29,
      VIOLET, 16,
      false, 5.22
    ),

    txt(
      'account for the search',
      CX,
      correctionY - 0.22,
      C.ink, 17
    )
  );

  const correctionArrows =
    groups.map((g, k) =>
      arrow(
        GX(k),
        MULTI_Y - 0.51,
        CX + (k - 1) * 1.32,
        correctionY + 0.63,
        g.color, 0.11
      )
    );

  const nextTukey = tag(
    'NEXT: TUKEY COMPARISONS',
    CX,
    Y(-2.43),
    VIOLET, 19
  );

  await until(S(30));
  await play(
    ...replace(
      multiAB,
      multiAC,
      multiBC,
      ...correctionArrows,
      correctionBox,
      nextTukey
    ),

    ...fbox([
      'after looking at the data',
      'account for multiple comparisons',
      ['next: Tukey comparisons', VIOLET]
    ], VIOLET),

    ...say('AFTER LOOKING, ACCOUNT FOR THE MULTIPLE COMPARISONS', VIOLET)
  );

  // ------------------------------------------------------------
  // 31: ONE-SENTENCE SUMMARY
  //
  // One question written before collecting data.
  // Weights -1/2, -1/2, +1.
  // Weight sum = 0.
  //
  // Observed contrast = 4.5 hours.
  // Standard error ≈ 1.22 hours.
  // t ≈ 3.67.
  // df = 9.
  // Two-sided p ≈ 0.005.
  // ------------------------------------------------------------

  const FINAL_TOP = Y(0.80);
  const FINAL_MID = Y(-0.35);
  const FINAL_BOTTOM = Y(-1.94);

  function finalWeightTile(k) {
    const g = groups[k];

    return new M.VGroup(
      outline(
        GX(k),
        FINAL_TOP,
        1.77, 1.12,
        g.color, 0.075
      ),

      txt(
        `BATCH ${g.name}: ${g.mean}`,
        GX(k),
        FINAL_TOP + 0.29,
        g.color, 16, true,
        1.63
      ),

      txt(
        `× ${WEIGHT_LABELS[k]}`,
        GX(k),
        FINAL_TOP - 0.21,
        g.color, 23, true
      )
    );
  }

  const finalWeights =
    groups.map((_, k) =>
      finalWeightTile(k)
    );

  const finalWeightSum = tag(
    '−½ − ½ + 1 = 0',
    CX,
    FINAL_MID,
    VIOLET, 19
  );

  const finalResult = new M.VGroup(
    outline(
      CX,
      FINAL_BOTTOM,
      5.82, 1.52,
      GREEN, 0.075
    ),

    txt(
      'NEW − OLD AVERAGE = 4.5 h',
      CX,
      FINAL_BOTTOM + 0.45,
      GREEN, 18, true,
      5.50
    ),

    txt(
      'SE ≈ 1.22    t ≈ 3.67',
      CX,
      FINAL_BOTTOM,
      C.ink, 19, true,
      5.46
    ),

    txt(
      'df = 9    p ≈ 0.5%',
      CX,
      FINAL_BOTTOM - 0.44,
      GREEN, 19, true,
      5.46
    )
  );

  const finalArrow = arrow(
    CX,
    FINAL_MID - 0.29,
    CX,
    FINAL_BOTTOM + 0.82,
    VIOLET, 0.12
  );

  await until(S(31));
  await play(
    ...replace(
      ...finalWeights,
      finalWeightSum,
      finalArrow,
      finalResult
    ),

    ...fbox([
      ['planned contrast', VIOLET],
      'one question, written first',
      ['weights add to zero', GREEN],
      't = contrast ÷ its SE'
    ], VIOLET),

    ...say('ONE PRE-WRITTEN COMPARISON, WEIGHTS ADD TO ZERO', GREEN)
  );

  await until(E(31));

  // ------------------------------------------------------------
  // END OF LESSON
  //
  // All sentence beats 0–31 are included.
  // Shared chapter data are unchanged.
  //
  // The contrast uses the exact prescribed weights:
  // A = -1/2, B = -1/2, C = +1.
  //
  // The weights sum to zero.
  //
  // The standard error uses the pooled within-batch mean
  // square of 4 and each group's actual sample size.
  //
  // Calculations retain full precision internally.
  // The two-sided p-value is calculated from the exact
  // Student t density with nine degrees of freedom.
  //
  // The equal-means example is explicitly hypothetical.
  // The power comparison is qualitative rather than an
  // invented numerical power calculation.
  //
  // The no-extra-correction statement applies to a single
  // genuinely prespecified contrast, not an unrestricted
  // collection of planned or post-hoc comparisons.
  //
  // Classical pooled-variance contrast inference assumes
  // independent observations, normal errors and a common
  // population variance.
  //
  // Uses the supplied engine interface and reference conventions.
  // Browser rendering and narration synchronization have not
  // been runtime-tested against the actual engine installation.
  // ------------------------------------------------------------
}
