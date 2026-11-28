// lesson 5.3.4
// Law of large numbers — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact simulation data from NumPy default_rng(289).
// The first ten running averages use every parcel.
// The longer running-average graph connects verified checkpoints
// on a logarithmic horizontal axis for efficient live rendering.
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

  const SEED = 289;
  const TRUE_MEAN = 10;

  const D = [0, 10, 20, 30];
  const PROB = [0.4, 0.3, 0.2, 0.1];
  const CONTRIBUTIONS = [0, 3, 4, 3];

  const FIRST10 = [20, 0, 0, 0, 20, 10, 0, 0, 0, 20];
  const TOTALS = [20, 20, 20, 20, 40, 50, 50, 50, 50, 70];
  const AVGS = TOTALS.map((v, k) => v / (k + 1));

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const delayColor = d => DC[d / 10];

  // Exact cumulative delay totals at selected checkpoints.
  // Each pair is [number of parcels, total delay in minutes].
  const CHECK100 = [
    [11, 70], [12, 80], [13, 80], [15, 140],
    [16, 160], [18, 210], [20, 230], [22, 240],
    [24, 280], [26, 300], [29, 330], [32, 330],
    [35, 380], [38, 400], [42, 480], [46, 510],
    [51, 550], [56, 590], [62, 640], [68, 730],
    [75, 800], [83, 930], [91, 1000], [100, 1140]
  ];

  const CHECK1000 = [
    [101, 1150], [112, 1260], [123, 1340], [136, 1460],
    [150, 1560], [166, 1660], [184, 1860], [203, 2100],
    [224, 2280], [248, 2580], [274, 2960], [302, 3190],
    [334, 3530], [369, 3850], [408, 4170], [450, 4610],
    [498, 5200], [550, 5690], [608, 6300], [671, 6910],
    [742, 7600], [819, 8300], [905, 9150], [1000, 10030]
  ];

  const CHECK10000 = [
    [1001, 10050], [1106, 11200], [1223, 12410],
    [1351, 13730], [1494, 15250], [1651, 16830],
    [1825, 18590], [2017, 20480], [2229, 22520],
    [2464, 25140], [2723, 27750], [3009, 30910],
    [3326, 33920], [3676, 37250], [4063, 40710],
    [4491, 45310], [4963, 50020], [5486, 55000],
    [6063, 60860], [6701, 66930], [7407, 74300],
    [8186, 82200], [9048, 90280], [10000, 100010]
  ];

  const FIRST_CHECKS = TOTALS.map((v, k) => [k + 1, v]);

  const ALL_CHECKS = [
    ...FIRST_CHECKS,
    ...CHECK100,
    ...CHECK1000,
    ...CHECK10000
  ];

  const commas = n => n.toLocaleString('en-US');

  function meanFmt(v, digits = 2) {
    return Number(v.toFixed(digits)).toString();
  }

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
    ? [0, 3.5, 0]
    : [4.3, -0.3, 0];

  const MAX_W = P ? FW - 1.2 : 7.1;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

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
    color = C.muted, sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function rect(
    w, h, x, y, color,
    opacity = 0.15, sw = 2
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
    fill = C.card, opacity = 0.95
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

  function outline(w, h, x, y, color = C.amber) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);
    r.moveTo([x, y, 0]);

    return r;
  }

  function arrow(x1, y1, x2, y2, color = C.muted) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const r = 0.14;

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
    x, y, color = C.cyan,
    radius = 0.095, opacity = 0.17
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

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);

    if (p.getWidth() > MAX_W) {
      p.scale(MAX_W / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function cell(
    value, x, y, color = C.cyan,
    w = 1.05, h = 0.64
  ) {
    return new M.VGroup(
      rounded(w, h, x, y, color, color, 0.09),
      txt(
        value,
        P ? 19 : 21,
        color,
        x, y,
        true, w - 0.12
      )
    );
  }

  function parcel(x, y, color, size = 0.65) {
    return new M.VGroup(
      rect(
        size, size * 0.78,
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
        x - size / 2, y + size * 0.13,
        x + size / 2, y + size * 0.13,
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

  function delayParcel(d, x, y, size = 0.65) {
    return new M.VGroup(
      parcel(x, y, delayColor(d), size),
      txt(
        `${d} min`,
        P ? 16 : 18,
        delayColor(d),
        x, y - size * 0.80,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Helpers return animations, never call play().
  // Groups are assembled only before their objects enter the scene.
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);
    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    const present = objects.filter(o => visible.includes(o));

    visible = visible.filter(o => !present.includes(o));

    return present.map(o => new M.FadeOut(o));
  }

  function swap(objects) {
    const old = visible.slice();
    visible = objects.slice();

    return [
      ...old.map(o => new M.FadeOut(o)),
      ...objects.map(o => new M.FadeIn(o))
    ];
  }

  function stagger(objects, runTime = 1.4, lagRatio = 0.12) {
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
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.36;

    const r = rounded(
      wd, ht,
      BOXP[0], BOXP[1],
      color
    );

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const ind =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

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

  // ============================================================
  // 0: Recall Monte Carlo convergence.
  // ============================================================

  const recapResults = [
    [100, '0.12'],
    [1000, '0.099'],
    [10000, '0.0991']
  ];

  const RECAP_Y = P
    ? [0.48, -1.05, -2.58]
    : [0.52, -0.85, -2.15];

  const RECAP_W = P ? 5.65 : 5.90;

  const recapRows = recapResults.map(([n, v], k) => {
    const y = RECAP_Y[k];

    return new M.VGroup(
      rounded(
        RECAP_W, 0.91,
        CX, y,
        k === 2 ? C.green : C.cyan
      ),
      txt(
        `${commas(n)} runs`,
        P ? 20 : 22,
        C.ink,
        CX - 1.38, y,
        true,
        2.65
      ),
      txt(
        v,
        P ? 24 : 26,
        k === 2 ? C.green : C.cyan,
        CX + 1.46, y,
        true
      )
    );
  });

  await until(S(0));
  await play(
    stagger(recapRows, 1.8, 0.25),
    ...say('MORE RUNS GAVE A CLOSER ESTIMATE', C.green),
    ...fbox([
      'last lesson:',
      ['true chance = 0.1', C.green],
      'estimates approach it'
    ], C.green)
  );

  // ============================================================
  // 1–2: The new question and the known model.
  // ============================================================

  const questionY = P ? -0.28 : -0.42;

  const questionCard = new M.VGroup(
    rounded(
      P ? 5.75 : 6.0,
      2.65,
      CX, questionY,
      C.amber
    ),
    parcel(
      CX, questionY + 0.49,
      C.cyan, 0.94
    ),
    txt(
      'AVERAGE DELAY?',
      P ? 24 : 28,
      C.amber,
      CX, questionY - 0.42,
      true
    ),
    txt(
      'How many minutes late?',
      P ? 20 : 22,
      C.ink,
      CX, questionY - 0.96
    )
  );

  await until(S(1));
  await play(
    ...swap([questionCard]),
    ...say('HOW LATE IS A PARCEL, ON AVERAGE?', C.amber),
    ...fbox([
      'new question:',
      ['mean parcel delay = ?', C.amber]
    ], C.amber)
  );

  // ------------------------------------------------------------
  // Model picture: four glowing probability bars.
  // ------------------------------------------------------------

  const BASE = P ? -3.00 : -1.65;
  const BAR_SP = P ? 1.48 : 1.60;
  const BAR_W = P ? 0.92 : 0.98;
  const BAR_SCALE = P ? 6.40 : 5.0;

  const barX = k => CX + (k - 1.5) * BAR_SP;

  const barAxis = line(
    barX(0) - BAR_SP / 2,
    BASE,
    barX(3) + BAR_SP / 2,
    BASE,
    C.muted, 2.5
  );

  const modelBars = PROB.map((p, k) => {
    const h = p * BAR_SCALE;
    const x = barX(k);

    return new M.VGroup(
      rect(
        BAR_W + 0.12, h + 0.05,
        x, BASE + h / 2,
        DC[k], 0.07, 1
      ),
      rect(
        BAR_W, h,
        x, BASE + h / 2,
        DC[k], 0.77
      ),
      txt(
        p.toFixed(1),
        P ? 20 : 21,
        DC[k],
        x, BASE + h + 0.25,
        true
      ),
      txt(
        `${D[k]} min`,
        P ? 17 : 18,
        DC[k],
        x, BASE - 0.34,
        true,
        BAR_SP - 0.06
      )
    );
  });

  const modelTitle = txt(
    'OUR MODEL OF PARCEL DELAYS',
    P ? 18 : 20,
    C.muted,
    CX,
    P ? 1.05 : 1.15,
    true
  );

  await until(S(2));
  await play(
    ...swap([barAxis, modelTitle]),
    stagger(modelBars, 1.6, 0.16),
    ...say('FIRST, FIND THE TRUE MODEL MEAN'),
    ...fbox([
      'delay × its chance',
      'for each possible delay'
    ])
  );

  // ============================================================
  // 3–6: Each delay's contribution to the true mean.
  // ============================================================

  const contributionY = P ? -4.12 : -2.38;

  const contributionCells = CONTRIBUTIONS.map((v, k) =>
    cell(
      String(v),
      barX(k),
      contributionY,
      DC[k],
      P ? 0.92 : 1.00,
      P ? 0.66 : 0.54
    )
  );

  const modelHighlights = PROB.map((p, k) => {
    const h = p * BAR_SCALE;

    return outline(
      BAR_W + 0.23,
      h + 0.15,
      barX(k),
      BASE + h / 2,
      DC[k]
    );
  });

  let activeBar = null;

  function selectBar(k) {
    const a = activeBar
      ? remove(activeBar)
      : [];

    activeBar = modelHighlights[k];

    return [
      ...a,
      ...add(activeBar, contributionCells[k])
    ];
  }

  // 3: 0 × 0.4 = 0.
  await until(S(3));
  await play(
    ...selectBar(0),
    ...say('0 MINUTES × 0.4 = 0', DC[0]),
    ...fbox([
      'delay × chance',
      ['0 × 0.4 = 0', DC[0]]
    ], DC[0])
  );

  // 4: 10 × 0.3 = 3.
  await until(S(4));
  await play(
    ...selectBar(1),
    ...say('10 MINUTES × 0.3 = 3', DC[1]),
    ...fbox([
      'delay × chance',
      ['10 × 0.3 = 3', DC[1]]
    ], DC[1])
  );

  // 5: 20 × 0.2 = 4.
  await until(S(5));
  await play(
    ...selectBar(2),
    ...say('20 MINUTES × 0.2 = 4', DC[2]),
    ...fbox([
      'delay × chance',
      ['20 × 0.2 = 4', DC[2]]
    ], DC[2])
  );

  // 6: 30 × 0.1 = 3.
  await until(S(6));
  await play(
    ...selectBar(3),
    ...say('30 MINUTES × 0.1 = 3', DC[3]),
    ...fbox([
      'delay × chance',
      ['30 × 0.1 = 3', DC[3]]
    ], DC[3])
  );

  // ============================================================
  // 7: Add all contributions.
  // ============================================================

  const sumY = P ? -1.20 : -0.50;
  const SUM_SP = P ? 1.32 : 1.40;

  const contributionRow = CONTRIBUTIONS.map((v, k) =>
    cell(
      v,
      CX + (k - 1.5) * SUM_SP,
      sumY,
      DC[k],
      0.82,
      0.78
    )
  );

  const sumPluses = Array.from({ length: 3 }, (_, k) =>
    txt(
      '+',
      25, C.muted,
      CX + (k - 1) * SUM_SP,
      sumY,
      true
    )
  );

  const sumTitle = txt(
    'ADD THE FOUR CONTRIBUTIONS',
    P ? 19 : 21,
    C.muted,
    CX, sumY + 0.86,
    true
  );

  const trueMeanResult = tag(
    '= 10 MINUTES',
    C.green,
    CX,
    P ? -2.85 : -1.90,
    25
  );

  const expectedNote = txt(
    'Expected value = long-run mean',
    P ? 19 : 20,
    C.ink,
    CX,
    P ? -3.70 : -2.58
  );

  await until(S(7));
  await play(
    ...swap([sumTitle, ...contributionRow, ...sumPluses]),
    ...say('ADD THE FOUR CONTRIBUTIONS', C.amber),
    ...fbox([
      ['0 + 3 + 4 + 3', C.amber]
    ], C.amber)
  );

  await until(S(7) + 2.3);

  await play(
    ...add(trueMeanResult, expectedNote),
    ...say('EXPECTED VALUE = LONG-RUN MEAN', C.green),
    ...fbox([
      '0 + 3 + 4 + 3 = 10',
      ['true mean = 10 min', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Running-average graph helpers
  // ------------------------------------------------------------

  const GX0 = CX - (P ? 2.64 : 2.92);
  const GX1 = CX + (P ? 3.02 : 3.14);

  const GY0 = P ? -3.76 : -2.10;
  const GY1 = P ? 0.82 : 0.73;

  const YMAX = 22;

  const gy = v =>
    GY0 + v / YMAX * (GY1 - GY0);

  const gxEarly = n =>
    GX0 + (n - 1) / 9 * (GX1 - GX0);

  const gxLog = n =>
    GX0 + Math.log10(n) / 4 * (GX1 - GX0);

  const graphTitleY = P ? 1.43 : 1.25;
  const axisLabelY = P ? -4.62 : -2.75;

  function graphAxes(mode = 'early') {
    const gx = mode === 'early' ? gxEarly : gxLog;

    const parts = [
      line(GX0, GY0, GX1, GY0, C.muted, 2.5),
      line(GX0, GY0, GX0, GY1, C.muted, 2.5)
    ];

    [0, 5, 10, 15, 20].forEach(v => {
      const y = gy(v);

      if (v !== 10 && v !== 0) {
        const gridLine = new M.DashedLine({
          start: [GX0, y, 0],
          end: [GX1, y, 0],
          color: C.muted
        });

        parts.push(gridLine);
      }

      parts.push(
        line(
          GX0 - 0.065, y,
          GX0 + 0.065, y,
          C.muted, 1.5
        ),
        txt(
          v,
          P ? 15 : 15,
          v === 10 ? C.green : C.muted,
          GX0 - 0.29, y,
          true
        )
      );
    });

    const ticks = mode === 'early'
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      : [1, 10, 100, 1000, 10000];

    ticks.forEach(n => {
      const x = gx(n);

      const lab =
        n === 1000 ? '1k' :
        n === 10000 ? '10k' :
        String(n);

      parts.push(
        line(
          x, GY0 - 0.065,
          x, GY0 + 0.065,
          C.muted, 1.5
        ),
        txt(
          lab,
          P ? 15 : 15,
          C.muted,
          x, GY0 - 0.24,
          true
        )
      );
    });

    parts.push(
      txt(
        mode === 'early'
          ? 'number of parcels'
          : 'number of parcels · ×10 per interval',
        P ? 15 : 16,
        C.muted,
        CX, axisLabelY
      ),
      txt(
        'minutes',
        15, C.muted,
        GX0 + 0.22,
        GY1 + 0.21
      )
    );

    return new M.VGroup(...parts);
  }

  function truthLine() {
    return new M.DashedLine({
      start: [GX0, gy(TRUE_MEAN), 0],
      end: [GX1, gy(TRUE_MEAN), 0],
      color: C.green
    });
  }

  function truthTag() {
    return tag(
      'TRUE MEAN = 10',
      C.green,
      GX1 - (P ? 1.05 : 1.0),
      gy(21),
      15
    );
  }

  function graphDot(n, avg, gx, color = C.cyan) {
    return glowDot(
      gx(n),
      gy(avg),
      color,
      P ? 0.071 : 0.068
    );
  }

  function graphSegment(
    n1, avg1, n2, avg2,
    gx, color = C.cyan
  ) {
    return line(
      gx(n1), gy(avg1),
      gx(n2), gy(avg2),
      color, 3.0
    );
  }

  function graphPath(checks, gx, color = C.cyan) {
    const parts = [];

    for (let k = 1; k < checks.length; k++) {
      const [n1, total1] = checks[k - 1];
      const [n2, total2] = checks[k];

      parts.push(
        graphSegment(
          n1, total1 / n1,
          n2, total2 / n2,
          gx, color
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function pathAnimations(
    checks, gx, color = C.cyan,
    runTime = 1.7
  ) {
    const segments = [];

    for (let k = 1; k < checks.length; k++) {
      const [n1, total1] = checks[k - 1];
      const [n2, total2] = checks[k];

      segments.push(
        graphSegment(
          n1, total1 / n1,
          n2, total2 / n2,
          gx, color
        )
      );
    }

    visible.push(...segments);

    return new M.LaggedStart(
      segments.map(s => new M.Create(s)),
      { lagRatio: 0.10, runTime }
    );
  }

  function completeGraph() {
    return [
      graphAxes('log'),
      truthLine(),
      graphPath(ALL_CHECKS, gxLog),
      truthTag(),
      graphDot(1, 20, gxLog),
      graphDot(10, 7, gxLog),
      graphDot(100, 11.4, gxLog),
      graphDot(1000, 10.03, gxLog),
      graphDot(10000, 10.001, gxLog, C.green),
      txt(
        'RUNNING AVERAGE',
        P ? 20 : 21,
        C.cyan,
        CX, graphTitleY,
        true
      )
    ];
  }

  // ============================================================
  // 8–10: Introduce the running-average graph.
  // ============================================================

  const earlyAxes = graphAxes('early');
  const earlyTruth = truthLine();
  const earlyTruthTag = truthTag();

  const graphHeading = txt(
    'MEAN DELAY SO FAR',
    P ? 20 : 21,
    C.cyan,
    CX, graphTitleY,
    true
  );

  await until(S(8));
  await play(
    ...swap([
      earlyAxes,
      graphHeading,
      earlyTruthTag
    ]),
    ...add(earlyTruth),
    ...say('CAN SIMULATION FIND THE TRUE MEAN?', C.green),
    ...fbox([
      ['true mean = 10 min', C.green],
      ['seed = 289', C.amber],
      'now simulate'
    ], C.green)
  );

  // 9: Simulate parcels one by one.
  await until(S(9));
  await play(
    ...say('ONE PARCEL AT A TIME'),
    ...fbox([
      '1. draw a parcel',
      '2. add its delay',
      '3. find the mean so far'
    ])
  );

  // 10: Name the running average.
  await until(S(10));
  await play(
    ...say('MEAN SO FAR = RUNNING AVERAGE', C.violet),
    ...fbox([
      ['running average', C.violet],
      'total delay so far',
      '÷ parcels so far'
    ], C.violet)
  );

  // ============================================================
  // 11–15: The first five simulated parcels.
  // ============================================================

  const earlyDots = [];
  const earlySegments = [];

  let currentParcelTag = null;

  function earlyPointAnimations(k) {
    const n = k + 1;
    const d = FIRST10[k];
    const avg = AVGS[k];

    const dot = graphDot(n, avg, gxEarly);
    const anims = [];

    if (k > 0) {
      const seg = graphSegment(
        k, AVGS[k - 1],
        n, avg,
        gxEarly
      );

      earlySegments.push(seg);
      visible.push(seg);

      anims.push(new M.Create(seg));
    }

    earlyDots.push(dot);
    anims.push(...add(dot));

    if (currentParcelTag) {
      anims.push(...remove(currentParcelTag));
    }

    currentParcelTag = tag(
      `PARCEL ${n}: ${d} MIN`,
      delayColor(d),
      CX,
      P ? -5.12 : -3.30,
      P ? 16 : 16
    );

    anims.push(...add(currentParcelTag));

    return anims;
  }

  // 11: Parcel 1 is 20 minutes late.
  await until(S(11));
  await play(
    ...earlyPointAnimations(0),
    ...say('PARCEL 1: RUNNING AVERAGE = 20', DC[2]),
    ...fbox([
      ['parcel 1 = 20 min', DC[2]],
      'total = 20',
      ['20 ÷ 1 = 20', C.cyan]
    ])
  );

  // 12: Parcel 2 is on time. The total remains 20.
  await until(S(12));
  await play(
    ...earlyPointAnimations(1),
    ...say('PARCEL 2: ON TIME', DC[0]),
    ...fbox([
      ['parcel 2 = 0 min', DC[0]],
      'total = 20 + 0 = 20',
      'count = 2'
    ])
  );

  await until(S(12) + 3.4);

  await play(
    new M.Indicate(earlyDots[1], {
      color: C.cyan
    }),
    ...say('RUNNING AVERAGE = 10 MINUTES'),
    ...fbox([
      'total = 20',
      'count = 2',
      ['20 ÷ 2 = 10', C.cyan]
    ])
  );

  // 13: Parcel 3 is also on time.
  await until(S(13));
  await play(
    ...earlyPointAnimations(2),
    ...say('PARCEL 3: RUNNING AVERAGE ≈ 6.7'),
    ...fbox([
      ['parcel 3 = 0 min', DC[0]],
      'total = 20',
      ['20 ÷ 3 ≈ 6.7', C.cyan]
    ])
  );

  // 14: Parcel 4 is on time.
  await until(S(14));
  await play(
    ...earlyPointAnimations(3),
    ...say('PARCEL 4: RUNNING AVERAGE = 5'),
    ...fbox([
      ['parcel 4 = 0 min', DC[0]],
      'total = 20',
      ['20 ÷ 4 = 5', C.cyan]
    ])
  );

  // 15: Parcel 5 is 20 minutes late.
  await until(S(15));
  await play(
    ...earlyPointAnimations(4),
    ...say('PARCEL 5: RUNNING AVERAGE = 8'),
    ...fbox([
      ['parcel 5 = 20 min', DC[2]],
      'total = 20 + 20 = 40',
      ['40 ÷ 5 = 8', C.cyan]
    ])
  );

  // ============================================================
  // 16–17: Early averages jump around.
  // ============================================================

  await until(S(16));
  await play(
    ...remove(currentParcelTag),
    new M.LaggedStart(
      earlyDots.map(d =>
        new M.Indicate(d, { color: C.amber })
      ),
      { lagRatio: 0.13, runTime: 2.1 }
    ),
    ...say('EARLY AVERAGES JUMP UP AND DOWN', C.amber),
    ...fbox([
      '20 → 10 → 6.7',
      '   → 5 → 8',
      ['large early changes', C.amber]
    ], C.amber)
  );

  currentParcelTag = null;

  // 17: Finish the first ten parcels.
  const moreEarly = [];

  for (let k = 5; k < 10; k++) {
    const seg = graphSegment(
      k, AVGS[k - 1],
      k + 1, AVGS[k],
      gxEarly
    );

    const dot = graphDot(
      k + 1,
      AVGS[k],
      gxEarly
    );

    moreEarly.push(seg, dot);
  }

  const tenTag = tag(
    '10 PARCELS: MEAN 7',
    C.amber,
    CX,
    P ? -5.12 : 0.99,
    16
  );

  await until(S(17));
  await play(
    stagger(moreEarly, 2.2, 0.15),
    ...say('AFTER 10 PARCELS: MEAN = 7'),
    ...fbox([
      'total = 70 minutes',
      'count = 10',
      ['70 ÷ 10 = 7', C.cyan]
    ])
  );

  await until(S(17) + 2.7);

  await play(
    ...add(tenTag)
  );

  // ============================================================
  // 18–21: Extend to 100, 1,000 and 10,000 parcels.
  //
  // Switch to a logarithmic horizontal axis so each tenfold
  // increase in sample size gets equal screen space.
  // ============================================================

  const logAxes = graphAxes('log');
  const logTruth = truthLine();
  const logTruthTag = truthTag();

  const logTitle = txt(
    'RUNNING AVERAGE',
    P ? 20 : 21,
    C.cyan,
    CX, graphTitleY,
    true
  );

  const firstLogPath = graphPath(
    FIRST_CHECKS,
    gxLog
  );

  const logFirstDot = graphDot(
    1, AVGS[0], gxLog
  );

  const logTenDot = graphDot(
    10, AVGS[9], gxLog
  );

  const checkpointNote = txt(
    'Selected running-average checkpoints',
    P ? 16 : 15, C.muted,
    CX,
    P ? -5.12 : -3.25
  );

  const point100 = graphDot(
    100, 11.4, gxLog
  );

  // 18: After 100 parcels, the mean is 11.4.
  await until(S(18));
  await play(
    ...swap([
      logAxes,
      logTruth,
      logTruthTag,
      logTitle,
      firstLogPath,
      logFirstDot,
      logTenDot,
      checkpointNote
    ]),
    pathAnimations(
      [[10, 70], ...CHECK100],
      gxLog,
      C.cyan,
      1.7
    ),
    ...add(point100),
    ...say('AFTER 100 PARCELS: 11.4'),
    ...fbox([
      'total = 1,140 min',
      'count = 100',
      ['mean = 11.4 min', C.cyan]
    ])
  );

  // 19: After 1,000 parcels, the mean is 10.03.
  const point1000 = graphDot(
    1000, 10.03, gxLog
  );

  await until(S(19));
  await play(
    pathAnimations(
      [[100, 1140], ...CHECK1000],
      gxLog,
      C.cyan,
      1.8
    ),
    ...add(point1000),
    ...say('AFTER 1,000 PARCELS: 10.03', C.green),
    ...fbox([
      'total = 10,030 min',
      'count = 1,000',
      ['mean = 10.03 min', C.green]
    ], C.green)
  );

  // 20: After 10,000 parcels, the mean rounds to 10.00.
  const point10000 = graphDot(
    10000, 10.001,
    gxLog, C.green
  );

  await until(S(20));
  await play(
    pathAnimations(
      [[1000, 10030], ...CHECK10000],
      gxLog,
      C.cyan,
      2.1
    ),
    ...add(point10000),
    ...say('AFTER 10,000 PARCELS: 10.00', C.green),
    ...fbox([
      'total = 100,010 min',
      'count = 10,000',
      ['mean ≈ 10.00 min', C.green]
    ], C.green)
  );

  // 21: The running average has settled near the true mean.
  const settledBandY = gy(10);
  const settledBandX0 = gxLog(1000);

  const settledBand = rect(
    GX1 - settledBandX0,
    gy(10.5) - gy(9.5),
    (GX1 + settledBandX0) / 2,
    settledBandY,
    C.green,
    0.13, 1
  );

  await until(S(21));
  await play(
    ...add(settledBand),
    new M.Indicate(point10000, {
      color: C.green
    }),
    ...say('THE LINE SETTLES NEAR THE TRUE MEAN', C.green),
    ...fbox([
      ['true mean = 10', C.green],
      ['simulation ≈ 10.00', C.cyan],
      'very close'
    ], C.green)
  );

  // ============================================================
  // 22–24: Why does the running average settle?
  //
  // A single new parcel has much less influence in a large group.
  // The added 30-minute parcel is illustrative, not the next
  // actual draw in the seed-289 sequence.
  // ============================================================

  const WEIGHT_Y = P ? -0.38 : -0.48;
  const WEIGHT_W = P ? 5.75 : 6.0;

  function influenceBar(nOld, y, title) {
    const n = nOld + 1;

    const newWidth = WEIGHT_W / n;
    const oldWidth = WEIGHT_W - newWidth;

    const left = CX - WEIGHT_W / 2;

    const parts = [
      rect(
        oldWidth, 0.62,
        left + oldWidth / 2, y,
        C.cyan, 0.62, 0
      ),
      rect(
        newWidth, 0.62,
        left + oldWidth + newWidth / 2, y,
        C.amber, 0.95, 0
      ),
      outline(
        WEIGHT_W, 0.62,
        CX, y,
        C.muted
      ),
      txt(
        title,
        P ? 20 : 22,
        C.ink,
        CX, y + 0.68,
        true
      )
    ];

    if (nOld <= 10) {
      parts.push(
        txt(
          `${nOld} old`,
          17, C.ink,
          left + oldWidth / 2,
          y,
          true
        ),
        txt(
          '1',
          19, C.ink,
          left + oldWidth + newWidth / 2,
          y,
          true
        )
      );
    } else {
      parts.push(
        txt(
          `${commas(nOld)} old parcels`,
          19, C.ink,
          CX, y,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const influenceLegend = new M.VGroup(
    rect(
      0.28, 0.22,
      CX - 1.80,
      P ? -2.17 : -1.84,
      C.cyan, 0.8, 1
    ),
    txt(
      'existing parcels',
      17, C.muted,
      CX - 0.72,
      P ? -2.17 : -1.84
    ),
    rect(
      0.28, 0.22,
      CX + 0.73,
      P ? -2.17 : -1.84,
      C.amber, 0.9, 1
    ),
    txt(
      'new parcel',
      17, C.amber,
      CX + 1.69,
      P ? -2.17 : -1.84
    )
  );

  // 22: One new value among many.
  const influence20 = influenceBar(
    19,
    WEIGHT_Y,
    '1 NEW PARCEL AMONG 20'
  );

  await until(S(22));
  await play(
    ...swap([influence20, influenceLegend]),
    ...say('EACH NEW PARCEL IS ONE VALUE AMONG MANY'),
    ...fbox([
      'every parcel has',
      'one equal share',
      ['of the average', C.cyan]
    ])
  );

  // 23: Five parcels plus one new late parcel.
  const fiveParcels = FIRST10.slice(0, 5).map((d, k) =>
    delayParcel(
      d,
      CX + (k - 2) * (P ? 0.99 : 1.02) - 0.40,
      P ? 0.75 : 0.58,
      0.53
    )
  );

  const newLateParcel = delayParcel(
    30,
    CX + 2.80,
    P ? 0.75 : 0.58,
    0.65
  );

  const newParcelFrame = outline(
    0.94, 1.23,
    CX + 2.80,
    P ? 0.48 : 0.31,
    C.amber
  );

  const fiveInfluence = influenceBar(
    5,
    P ? -1.20 : -1.03,
    'ONE NEW VALUE HAS A LARGE SHARE'
  );

  const fiveResult = txt(
    '8.00 → 11.67 minutes',
    P ? 24 : 25,
    C.amber,
    CX,
    P ? -2.84 : -2.35,
    true
  );

  await until(S(23));
  await play(
    ...swap([
      ...fiveParcels,
      newLateParcel,
      newParcelFrame,
      fiveInfluence,
      fiveResult
    ]),
    ...say('WITH FIVE PARCELS, ONE MORE MATTERS', C.amber),
    ...fbox([
      '40 ÷ 5 = 8',
      'add 30 minutes',
      ['70 ÷ 6 ≈ 11.67', C.amber]
    ], C.amber)
  );

  // 24: Add the same illustrative 30-minute parcel to 10,000.
  const largeInfluence = influenceBar(
    10000,
    P ? -0.65 : -0.47,
    'ONE MORE AMONG 10,001'
  );

  const influencePointer = arrow(
    GX1 - 0.40,
    P ? 0.45 : 0.42,
    CX + WEIGHT_W / 2,
    (P ? -0.65 : -0.47) + 0.36,
    C.amber
  );

  const tinyWeight = txt(
    'The new share is too small to see clearly',
    P ? 18 : 19,
    C.amber,
    CX,
    P ? -1.79 : -1.54
  );

  const largeResult = txt(
    '10.001 → 10.003 minutes',
    P ? 23 : 24,
    C.green,
    CX,
    P ? -2.83 : -2.40,
    true
  );

  await until(S(24));
  await play(
    ...swap([
      largeInfluence,
      influencePointer,
      tinyWeight,
      largeResult
    ]),
    ...say('WITH 10,000 PARCELS, ONE BARELY MATTERS', C.green),
    ...fbox([
      'add the same 30 min',
      '100,040 ÷ 10,001',
      ['mean ≈ 10.003', C.green]
    ], C.green)
  );

  // ============================================================
  // 25: Ink in a cup versus ink in a bathtub.
  // ============================================================

  const WATER = C.blue || '#60A5FA';
  const INK_DROP = C.violet;

  const cupX = CX - 1.92;
  const bathX = CX + 1.28;
  const waterY = P ? -0.85 : -0.70;

  const cupW = 1.43;
  const cupH = 1.72;

  const bathW = P ? 3.42 : 3.65;
  const bathH = 1.38;

  function vessel(x, y, w, h, waterColor, opacity) {
    return new M.VGroup(
      rect(
        w - 0.12,
        h * 0.67,
        x,
        y - h * 0.12,
        waterColor,
        opacity, 0
      ),
      line(
        x - w / 2, y + h / 2,
        x - w / 2, y - h / 2,
        C.ink, 2.5
      ),
      line(
        x - w / 2, y - h / 2,
        x + w / 2, y - h / 2,
        C.ink, 2.5
      ),
      line(
        x + w / 2, y - h / 2,
        x + w / 2, y + h / 2,
        C.ink, 2.5
      )
    );
  }

  const cup = vessel(
    cupX, waterY,
    cupW, cupH,
    WATER, 0.35
  );

  const bathtub = vessel(
    bathX, waterY,
    bathW, bathH,
    WATER, 0.35
  );

  const cupLabel = txt(
    'CUP',
    18, C.ink,
    cupX,
    waterY - cupH / 2 - 0.35,
    true
  );

  const bathLabel = txt(
    'BATHTUB',
    18, C.ink,
    bathX,
    waterY - bathH / 2 - 0.35,
    true
  );

  const cupDrop = glowDot(
    cupX,
    waterY + 1.48,
    INK_DROP,
    0.13
  );

  const bathDrop = glowDot(
    bathX,
    waterY + 1.48,
    INK_DROP,
    0.13
  );

  const cupMixed = rect(
    cupW - 0.12,
    cupH * 0.67,
    cupX,
    waterY - cupH * 0.12,
    INK_DROP,
    0.48, 0
  );

  const bathMixed = rect(
    bathW - 0.12,
    bathH * 0.67,
    bathX,
    waterY - bathH * 0.12,
    INK_DROP,
    0.055, 0
  );

  const dilutionNote = txt(
    'Same drop. Very different influence.',
    P ? 20 : 21,
    C.ink,
    CX,
    P ? -3.20 : -2.55
  );

  await until(S(25));
  await play(
    ...swap([
      cup, bathtub,
      cupLabel, bathLabel,
      cupDrop, bathDrop
    ]),
    ...say('ONE DROP IN A CUP OR A BATHTUB', C.violet),
    ...fbox([
      'same added amount',
      'different group sizes'
    ], C.violet)
  );

  await until(S(25) + 1.6);

  await play(
    new M.Transform(
      cupDrop,
      glowDot(cupX, waterY, INK_DROP, 0.13),
      { runTime: 0.65 }
    ),
    new M.Transform(
      bathDrop,
      glowDot(bathX, waterY, INK_DROP, 0.13),
      { runTime: 0.65 }
    )
  );

  await play(
    ...remove(cupDrop, bathDrop),
    ...add(cupMixed, bathMixed, dilutionNote),
    ...say('A BIGGER GROUP DILUTES THE EFFECT', C.green),
    ...fbox([
      ['small group: big effect', C.violet],
      ['large group: tiny effect', C.green]
    ], C.green)
  );

  // ============================================================
  // 26–28: Name and explain the law of large numbers.
  // ============================================================

  const lawGraph = completeGraph();

  await until(S(26));
  await play(
    ...swap(lawGraph),
    ...say('LAW OF LARGE NUMBERS', C.violet),
    ...fbox([
      ['law of large numbers', C.violet],
      'averages settle near',
      'their true mean'
    ], C.violet)
  );

  // 27: The mathematical idea in plain words.
  const lawEnd = lawGraph[lawGraph.length - 2];

  await until(S(27));
  await play(
    new M.Indicate(lawEnd, {
      color: C.green
    }),
    ...say('AVERAGE MANY INDEPENDENT VALUES', C.green),
    ...fbox([
      'same model',
      'independent values',
      ['more values → true mean', C.green]
    ], C.green)
  );

  // 28: Independence: one parcel does not affect another.
  const independentDelays = [20, 0, 10, 30, 0];

  const independentParcels = independentDelays.map((d, k) =>
    delayParcel(
      d,
      CX + (k - 2) * (P ? 1.13 : 1.18),
      P ? -0.16 : -0.30,
      0.72
    )
  );

  const independentTitle = txt(
    'EACH PARCEL GETS ITS OWN DRAW',
    P ? 19 : 21,
    C.cyan,
    CX,
    P ? 1.02 : 1.03,
    true
  );

  const separators = Array.from({ length: 4 }, (_, k) =>
    new M.DashedLine({
      start: [
        CX + (k - 1.5) * (P ? 1.13 : 1.18),
        P ? 0.48 : 0.33,
        0
      ],
      end: [
        CX + (k - 1.5) * (P ? 1.13 : 1.18),
        P ? -1.02 : -1.17,
        0
      ],
      color: C.muted
    })
  );

  const independentNote = tag(
    'NO PARCEL CHANGES ANOTHER',
    C.green,
    CX,
    P ? -2.54 : -2.35,
    18
  );

  await until(S(28));
  await play(
    ...swap([
      independentTitle,
      ...separators
    ]),
    stagger(independentParcels, 1.9, 0.17),
    ...add(independentNote),
    ...say('INDEPENDENT = NO EFFECT ON THE NEXT PARCEL'),
    ...fbox([
      'one parcel’s delay',
      'does not change',
      ['another’s chances', C.green]
    ], C.green)
  );

  // ============================================================
  // 29–32: Introduce n, X bar, and the running-average formula.
  // ============================================================

  const formulaParcels = FIRST10.slice(0, 5).map((d, k) =>
    cell(
      String(d),
      CX + (k - 2) * (P ? 1.13 : 1.18),
      P ? 0.68 : 0.56,
      delayColor(d),
      P ? 0.96 : 1.02,
      0.70
    )
  );

  const formulaCountLineY = P ? -0.08 : -0.16;

  const countBrace = new M.VGroup(
    line(
      CX - 2.76, formulaCountLineY,
      CX + 2.76, formulaCountLineY,
      C.violet, 2.5
    ),
    line(
      CX - 2.76, formulaCountLineY,
      CX - 2.76, formulaCountLineY + 0.22,
      C.violet, 2.5
    ),
    line(
      CX + 2.76, formulaCountLineY,
      CX + 2.76, formulaCountLineY + 0.22,
      C.violet, 2.5
    )
  );

  const countLabel = txt(
    'n = 5 parcels',
    P ? 24 : 25,
    C.violet,
    CX,
    formulaCountLineY - 0.46,
    true
  );

  // 29: n is the number of parcels so far.
  await until(S(29));
  await play(
    ...swap([
      ...formulaParcels,
      countBrace,
      countLabel
    ]),
    ...say('n = NUMBER OF PARCELS SO FAR', C.violet),
    ...fbox([
      ['n = parcel count', C.violet],
      'here, n = 5'
    ], C.violet)
  );

  // 30: X bar denotes the running average.
  const xBarY = P ? -2.10 : -1.65;

  const xBarSymbol = txt(
    'X',
    43, C.cyan,
    CX - 1.10,
    xBarY,
    true
  );

  const xBarTop = line(
    CX - 1.32,
    xBarY + 0.39,
    CX - 0.88,
    xBarY + 0.39,
    C.cyan, 3
  );

  const xBarMeaning = txt(
    '= mean so far',
    P ? 23 : 25,
    C.cyan,
    CX + 0.75,
    xBarY,
    true,
    3.60
  );

  await until(S(30));
  await play(
    ...add(xBarSymbol, xBarTop, xBarMeaning),
    ...say('X BAR = THE RUNNING AVERAGE', C.cyan),
    ...fbox([
      ['X̄ = running average', C.cyan],
      'read it: X bar'
    ])
  );

  // 31: Sum of first n delays, divided by n.
  const fractionY = P ? -1.42 : -1.25;
  const fractionW = P ? 5.68 : 5.85;

  const shortFormula = new M.VGroup(
    txt(
      'X̄ =',
      P ? 30 : 32,
      C.cyan,
      CX - 2.39,
      fractionY,
      true
    ),
    txt(
      'sum of first n delays',
      P ? 21 : 23,
      C.amber,
      CX + 0.52,
      fractionY + 0.42,
      false, 4.40
    ),
    line(
      CX - 1.58, fractionY,
      CX + 2.76, fractionY,
      C.ink, 2.5
    ),
    txt(
      'n',
      P ? 27 : 29,
      C.violet,
      CX + 0.52,
      fractionY - 0.43,
      true
    )
  );

  const formulaExample = tag(
    'X̄ = 40 ÷ 5 = 8 MINUTES',
    C.green,
    CX,
    P ? -3.05 : -2.43,
    18
  );

  await until(S(31));
  await play(
    ...remove(
      countBrace,
      countLabel,
      xBarSymbol,
      xBarTop,
      xBarMeaning
    ),
    ...add(shortFormula, formulaExample),
    ...say('SUM THE DELAYS, THEN DIVIDE BY n', C.green),
    ...fbox([
      'X̄ = sum ÷ n',
      '  = 40 ÷ 5',
      ['  = 8 minutes', C.green]
    ], C.green)
  );

  // 32: As n grows, X bar settles near 10.
  const formulaGraph = completeGraph();

  await until(S(32));
  await play(
    ...swap(formulaGraph),
    ...say('AS n GROWS, X BAR SETTLES NEAR 10', C.green),
    ...fbox([
      ['n grows', C.violet],
      ['X̄ approaches 10', C.green],
      'the true mean'
    ], C.green)
  );

  // ============================================================
  // 33–34: A simulated chance is also a running average.
  // ============================================================

  // "Late" retains the chapter's definition: exactly 30 minutes.
  // All other delays, including 10 and 20, receive score zero.
  const scoreExample = [
    0, 0, 0, 0,
    10, 10, 10,
    20, 20, 30
  ];

  function scorePosition(k) {
    const x = CX + (k % 5 - 2) * (P ? 1.13 : 1.20);
    const y = (P ? 0.71 : 0.56) -
      Math.floor(k / 5) * (P ? 1.91 : 1.66);

    return [x, y];
  }

  const scoreParcels = scoreExample.map((d, k) => {
    const [x, y] = scorePosition(k);

    return delayParcel(d, x, y, 0.54);
  });

  const binaryCells = scoreExample.map((d, k) => {
    const [x, y] = scorePosition(k);
    const late = d === 30;

    return cell(
      late ? '1' : '0',
      x,
      y - 0.91,
      late ? DC[3] : C.cyan,
      0.58, 0.47
    );
  });

  // 33: Turn each run into a yes-or-no score.
  await until(S(33));
  await play(
    ...swap([]),
    stagger(scoreParcels, 1.5, 0.10),
    ...say('LATE = 1. NOT LATE = 0.', C.violet),
    ...fbox([
      ['30 min late → 1', DC[3]],
      ['other delays → 0', C.cyan]
    ], C.violet)
  );

  await until(S(33) + 2.0);

  await play(
    stagger(binaryCells, 2.0, 0.12)
  );

  // ------------------------------------------------------------
  // Recall the exact Monte Carlo estimates from seed 39.
  // These are a separate simulation from the seed-289 delay means.
  // ------------------------------------------------------------

  const chanceResults = [
    [100, 12, 0.12, '0.12'],
    [1000, 99, 0.099, '0.099'],
    [10000, 991, 0.0991, '0.0991']
  ];

  const CH_W = P ? 5.70 : 6.0;
  const CH_MIN = 0.075;
  const CH_MAX = 0.125;

  const chx = v =>
    CX - CH_W / 2 +
    (v - CH_MIN) / (CH_MAX - CH_MIN) * CH_W;

  const chanceYs = P
    ? [0.34, -1.22, -2.78]
    : [0.43, -0.81, -2.00];

  function chanceComparisonRow(row, k) {
    const [n, late, estimate, label] = row;
    const y = chanceYs[k];

    return new M.VGroup(
      line(
        chx(CH_MIN), y,
        chx(CH_MAX), y,
        C.muted, 1.7
      ),
      line(
        chx(0.1), y,
        chx(estimate), y,
        C.amber, 3.5
      ),
      glowDot(
        chx(0.1), y,
        C.green, 0.076
      ),
      glowDot(
        chx(estimate), y,
        C.cyan, 0.083
      ),
      txt(
        `${commas(n)} runs`,
        P ? 17 : 18,
        C.muted,
        chx(CH_MIN) + 0.78,
        y + 0.36,
        true
      ),
      txt(
        label,
        P ? 18 : 20,
        C.cyan,
        chx(CH_MAX) - 0.43,
        y + 0.36,
        true
      )
    );
  }

  const chanceTruth = new M.DashedLine({
    start: [
      chx(0.1),
      chanceYs[2] - 0.27,
      0
    ],
    end: [
      chx(0.1),
      chanceYs[0] + 0.56,
      0
    ],
    color: C.green
  });

  const chanceTruthLabel = tag(
    'TRUE CHANCE = 0.1',
    C.green,
    chx(0.1),
    chanceYs[0] + 0.91,
    16
  );

  const chanceRows = chanceResults.map(chanceComparisonRow);

  const chanceAxisLabels = [
    txt(
      '0.075',
      16, C.muted,
      chx(CH_MIN),
      chanceYs[2] - 0.33,
      true
    ),
    txt(
      '0.125',
      16, C.muted,
      chx(CH_MAX),
      chanceYs[2] - 0.33,
      true
    )
  ];

  // 34: The share of late parcels is the mean of zero-one scores.
  await until(S(34));
  await play(
    ...swap([
      chanceTruth,
      chanceTruthLabel,
      ...chanceAxisLabels
    ]),
    stagger(chanceRows, 2.4, 0.25),
    ...say('A SHARE IS ALSO AN AVERAGE', C.green),
    ...fbox([
      'mean of 0–1 scores',
      '= late count ÷ runs',
      ['settles near 0.1', C.green]
    ], C.green)
  );

  // ============================================================
  // 35–36: What is the law useful for?
  // ============================================================

  function miniChart(x, y, w, h, color = C.cyan) {
    const values = [
      0.90, 0.27, 0.65, 0.42,
      0.57, 0.48, 0.54, 0.50,
      0.51, 0.50, 0.50
    ];

    const xx = k => x - w / 2 + k / 10 * w;
    const yy = v => y - h / 2 + v * h;

    const parts = [
      line(
        x - w / 2, yy(0.5),
        x + w / 2, yy(0.5),
        C.green, 1.8
      )
    ];

    for (let k = 1; k < values.length; k++) {
      parts.push(
        line(
          xx(k - 1), yy(values[k - 1]),
          xx(k), yy(values[k]),
          color, 2.5
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const reasonCard = new M.VGroup(
    rounded(
      P ? 5.95 : 6.20,
      2.70,
      CX,
      P ? -0.35 : -0.45,
      C.green
    ),
    txt(
      'WHY SIMULATION WORKS',
      P ? 23 : 25,
      C.green,
      CX,
      P ? 0.60 : 0.51,
      true
    ),
    miniChart(
      CX,
      P ? -0.34 : -0.42,
      P ? 4.70 : 5.0,
      1.10
    ),
    txt(
      'Many runs reveal stable averages',
      P ? 18 : 20,
      C.ink,
      CX,
      P ? -1.36 : -1.45
    )
  );

  // 35: The law explains why averages over many runs are useful.
  await until(S(35));
  await play(
    ...swap([reasonCard]),
    ...say('THIS IS WHY SIMULATION WORKS', C.green),
    ...fbox([
      'many independent runs',
      ['more stable averages', C.green],
      'better long-run estimates'
    ], C.green)
  );

  // 36: Insurers and shops can plan around averages.
  // Pictures are illustrative rather than additional simulated data.
  function person(x, y, color) {
    const head = new M.Circle({
      radius: 0.085,
      color
    });

    head.setFill(color, 0.90);
    head.moveTo([x, y + 0.13, 0]);

    const body = new M.Arc({
      radius: 0.15,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);
    body.moveTo([x, y - 0.07, 0]);

    return new M.VGroup(head, body);
  }

  const USE_W = P ? 2.79 : 2.95;
  const USE_X = P ? 1.57 : 1.65;
  const USE_Y = P ? -0.55 : -0.55;

  function planningCard(title, subtitle, x, y, color) {
    const parts = [
      rounded(
        USE_W, 2.76,
        x, y,
        color
      ),
      txt(
        title,
        P ? 21 : 22,
        color,
        x, y + 0.99,
        true,
        USE_W - 0.20
      )
    ];

    for (let k = 0; k < 20; k++) {
      const px = x + (k % 5 - 2) * 0.42;
      const py = y + 0.42 - Math.floor(k / 5) * 0.40;

      const pc = [
        C.cyan,
        C.violet,
        C.amber,
        C.green
      ][k % 4];

      parts.push(person(px, py, pc));
    }

    parts.push(
      txt(
        subtitle,
        P ? 16 : 17,
        C.ink,
        x, y - 1.05,
        false,
        USE_W - 0.17
      )
    );

    return new M.VGroup(...parts);
  }

  const insurerCard = planningCard(
    'INSURERS',
    'Many customers',
    CX - USE_X,
    USE_Y,
    C.violet
  );

  const shopCard = planningCard(
    'SHOPS',
    'Many purchases',
    CX + USE_X,
    USE_Y,
    C.cyan
  );

  const planningTag = tag(
    'INDIVIDUALS VARY. LARGE AVERAGES SETTLE.',
    C.green,
    CX,
    P ? -3.00 : -2.53,
    16
  );

  await until(S(36));
  await play(
    ...swap([insurerCard, shopCard]),
    ...add(planningTag),
    ...say('LARGE GROUPS HELP US PLAN', C.green),
    ...fbox([
      'one customer varies',
      'thousands of customers',
      ['give steadier averages', C.green]
    ], C.green)
  );

  // ============================================================
  // 37–39: Common trap — expecting later values to compensate.
  // ============================================================

  // Illustrative unlucky start, not the seed-289 sequence.
  const unluckyDelays = [30, 30, 30, 30];

  const unluckyParcels = unluckyDelays.map((d, k) =>
    delayParcel(
      d,
      CX + (k - 1.5) * (P ? 1.40 : 1.45),
      P ? 0.34 : 0.15,
      0.77
    )
  );

  const unluckyTitle = txt(
    'AN UNLUCKY START',
    P ? 20 : 22,
    DC[3],
    CX,
    P ? 1.40 : 1.21,
    true
  );

  const unluckyMean = tag(
    'FIRST FOUR: MEAN 30',
    DC[3],
    CX,
    P ? -1.32 : -1.38,
    19
  );

  // 37: Suppose the first few parcels are unusually late.
  await until(S(37));
  await play(
    ...swap([unluckyTitle]),
    stagger(unluckyParcels, 1.5, 0.17),
    ...add(unluckyMean),
    ...say('TRAP: THE FIRST PARCELS WERE VERY LATE', DC[3]),
    ...fbox([
      'illustrative start:',
      '30, 30, 30, 30',
      ['mean = 30 minutes', DC[3]]
    ], DC[3])
  );

  // 38: The mistaken belief that the next parcel must be early.
  const mustBeEarly = new M.VGroup(
    rounded(
      P ? 5.85 : 6.10,
      0.82,
      CX,
      P ? -2.75 : -2.39,
      C.amber
    ),
    txt(
      '“THE NEXT ONE MUST BE ON TIME”',
      P ? 17 : 18,
      C.amber,
      CX,
      P ? -2.75 : -2.39,
      true,
      P ? 5.58 : 5.83
    )
  );

  await until(S(38));
  await play(
    ...add(mustBeEarly),
    ...say('MUST THE NEXT PARCEL MAKE UP FOR IT?', C.amber),
    ...fbox([
      'mistaken idea:',
      'late values must be',
      ['followed by early values', C.amber]
    ], C.amber)
  );

  // 39: False — the next parcel has the same model chances.
  const NEXT_RW = P ? 6.05 : 6.30;
  const NEXT_RY = P ? -0.55 : -0.45;
  const NEXT_RH = 0.68;

  const CUTS = [0, 0.4, 0.7, 0.9, 1.0];

  const nx = v =>
    CX - NEXT_RW / 2 + v * NEXT_RW;

  const nextRulerParts = [];

  for (let k = 0; k < 4; k++) {
    const a = CUTS[k];
    const b = CUTS[k + 1];

    const x = nx((a + b) / 2);
    const w = NEXT_RW * (b - a);

    nextRulerParts.push(
      rect(
        w, NEXT_RH,
        x, NEXT_RY,
        DC[k], 0.62, 1.5
      ),
      txt(
        D[k],
        19, C.ink,
        x, NEXT_RY,
        true,
        w - 0.10
      ),
      txt(
        PROB[k].toFixed(1),
        17, DC[k],
        x,
        NEXT_RY + NEXT_RH / 2 + 0.29,
        true
      )
    );
  }

  CUTS.forEach(v => {
    nextRulerParts.push(
      line(
        nx(v),
        NEXT_RY - NEXT_RH / 2 - 0.075,
        nx(v),
        NEXT_RY + NEXT_RH / 2 + 0.075,
        C.muted, 1.5
      ),
      txt(
        v === 0 ? '0' : v.toFixed(1),
        15, C.muted,
        nx(v),
        NEXT_RY - NEXT_RH / 2 - 0.28,
        true
      )
    );
  });

  const nextRuler = new M.VGroup(...nextRulerParts);

  const nextTitle = txt(
    'THE NEXT PARCEL',
    P ? 22 : 24,
    C.cyan,
    CX,
    P ? 1.25 : 1.11,
    true
  );

  const sameChances = tag(
    'EXACTLY THE SAME CHANCES AS BEFORE',
    C.green,
    CX,
    P ? -2.15 : -1.97,
    17
  );

  await until(S(39));
  await play(
    ...swap([
      nextRuler,
      nextTitle,
      sameChances
    ]),
    ...say('FALSE: THE NEXT PARCEL HAS THE SAME CHANCES', DC[3]),
    ...fbox([
      ['0 min    0.4', DC[0]],
      ['10 min   0.3', DC[1]],
      ['20 min   0.2', DC[2]],
      ['30 min   0.1', DC[3]]
    ])
  );

  // ============================================================
  // 40: Early values remain, but their influence shrinks.
  //
  // Show their exact weight in a growing group.
  // This is a conceptual illustration of dilution, not a claim
  // that the following parcels must compensate for the early ones.
  // ============================================================

  const DILUTE_W = P ? 5.85 : 6.05;

  const diluteYs = P
    ? [0.66, -1.10, -2.86]
    : [0.70, -0.74, -2.12];

  function diluteRow(n, y) {
    const oldFraction = 4 / n;
    const redW = DILUTE_W * oldFraction;
    const cyanW = DILUTE_W - redW;

    const left = CX - DILUTE_W / 2;

    const parts = [
      rect(
        redW, 0.46,
        left + redW / 2,
        y,
        DC[3], 0.88, 0
      )
    ];

    if (cyanW > 0) {
      parts.push(
        rect(
          cyanW, 0.46,
          left + redW + cyanW / 2,
          y,
          C.cyan, 0.68, 0
        )
      );
    }

    parts.push(
      outline(
        DILUTE_W, 0.46,
        CX, y,
        C.muted
      ),
      txt(
        `${commas(n)} parcels`,
        P ? 18 : 19,
        C.ink,
        CX - 1.65,
        y + 0.48,
        true
      ),
      txt(
        `first four: ${meanFmt(100 * oldFraction, 2)}%`,
        P ? 16 : 17,
        DC[3],
        CX + 1.38,
        y + 0.48,
        true,
        2.90
      )
    );

    return new M.VGroup(...parts);
  }

  const diluteRows = [
    diluteRow(4, diluteYs[0]),
    diluteRow(100, diluteYs[1]),
    diluteRow(10000, diluteYs[2])
  ];

  const dilutionFinal = tag(
    'THE FIRST FOUR ARE STILL THERE',
    C.green,
    CX,
    P ? -4.10 : -2.78,
    16
  );

  await until(S(40));
  await play(
    ...swap([]),
    stagger(diluteRows, 2.7, 0.30),
    ...say('EARLY VALUES ARE DILUTED, NOT CANCELLED', C.green),
    ...fbox([
      'first four values:',
      '4/4 = 100%',
      '4/100 = 4%',
      ['4/10,000 = 0.04%', C.green]
    ], C.green)
  );

  await until(S(40) + 3.0);

  await play(
    ...add(dilutionFinal)
  );

  // ============================================================
  // 41: Final one-picture summary.
  // ============================================================

  const finalGraph = completeGraph();

  const finalPoint = finalGraph[finalGraph.length - 2];

  const finalValuesY = P ? -5.15 : -3.30;

  const finalValues = txt(
    '7 → 11.4 → 10.03 → 10.00',
    P ? 20 : 19,
    C.green,
    CX,
    finalValuesY,
    true
  );

  await until(S(41));
  await play(
    ...swap(finalGraph),
    ...say('MORE INDEPENDENT VALUES, STEADIER AVERAGES', C.green),
    ...fbox([
      ['law of large numbers', C.violet],
      'more independent values',
      ['mean → true mean', C.green]
    ], C.green)
  );

  await until(S(41) + 2.0);

  await play(
    ...add(finalValues),
    new M.Indicate(finalPoint, {
      color: C.green,
      runTime: 1.0
    }),
    ...fbox([
      '10 parcels:      7',
      '100 parcels:   11.4',
      '1,000:        10.03',
      ['10,000:       10.00', C.green]
    ], C.green)
  );

  await until(S(41) + 4.1);

  await play(
    ...say('THE AVERAGE SETTLES TO THE TRUE MEAN', C.green),
    ...fbox([
      ['X̄ → true mean', C.green],
      'as the number of',
      'independent values grows'
    ], C.green)
  );

  await until(E(41));
}
