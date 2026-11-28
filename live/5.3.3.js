// lesson 5.3.3
// Monte Carlo estimates — Chapter 5.3: Simulation and convergence.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact seed-39 results from NumPy default_rng:
//     100 parcels:  12 late
//   1,000 parcels:  99 late
//  10,000 parcels: 991 late
//
// The first 100 parcel positions and the aggregated counts below
// were checked against the original NumPy sequence.
// Larger samples use aggregated tiles to avoid rendering 10,000
// individual mobjects on a phone.
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

  const D = [0, 10, 20, 30];
  const PROB = [0.4, 0.3, 0.2, 0.1];
  const CUTS = [0, 0.4, 0.7, 0.9, 1.0];

  const DC = [
    C.teal || '#2DD4BF',
    C.blue || '#60A5FA',
    C.amber,
    C.red || '#F87171'
  ];

  const LATE = DC[3];
  const NOT_LATE = C.cyan;

  const delayOf = u =>
    u < 0.4 ? 0 :
    u < 0.7 ? 10 :
    u < 0.9 ? 20 : 30;

  // Exact positions of late parcels among the first 100 draws.
  // Zero-based positions in the seed-39 sequence.
  const LATE100 = new Set([
    8, 17, 36, 40, 45, 48,
    61, 74, 76, 83, 89, 97
  ]);

  // Exact late counts in consecutive groups of 10 parcels,
  // covering the first 1,000 draws from seed 39.
  // Sum = 99.
  const GROUP10 = [
    1, 1, 0, 1, 3, 0, 1, 2, 2, 1,
    1, 0, 0, 0, 0, 2, 0, 0, 0, 0,
    0, 2, 1, 2, 2, 0, 3, 1, 1, 0,
    0, 2, 0, 1, 2, 3, 0, 0, 1, 2,
    0, 0, 1, 2, 0, 1, 0, 1, 3, 2,
    2, 1, 1, 2, 0, 1, 1, 1, 0, 1,
    1, 1, 0, 1, 2, 0, 0, 0, 1, 1,
    2, 0, 1, 0, 0, 1, 0, 1, 0, 3,
    1, 1, 2, 1, 1, 2, 1, 1, 1, 0,
    0, 2, 2, 1, 2, 0, 2, 1, 3, 2
  ];

  // Exact late counts in consecutive groups of 100 parcels,
  // covering all 10,000 draws from seed 39.
  // Sum = 991.
  const GROUP100 = [
    12, 3, 12, 11, 10, 10, 7, 8, 11, 15,
    7, 11, 15, 9, 12, 11, 10, 11, 8, 8,
    16, 11, 14, 5, 12, 6, 16, 12, 7, 14,
    9, 15, 11, 8, 5, 12, 15, 9, 13, 10,
    10, 7, 9, 12, 7, 8, 13, 8, 11, 6,
    7, 10, 9, 10, 5, 7, 8, 7, 10, 15,
    7, 9, 7, 5, 13, 11, 10, 6, 11, 6,
    12, 3, 11, 11, 6, 10, 9, 11, 7, 8,
    11, 8, 10, 13, 10, 6, 11, 10, 11, 12,
    8, 10, 10, 12, 11, 9, 17, 14, 17, 8
  ];

  const RESULTS = [
    { n: 100, late: 12, estimate: 0.12, label: '0.12' },
    { n: 1000, late: 99, estimate: 0.099, label: '0.099' },
    { n: 10000, late: 991, estimate: 0.0991, label: '0.0991' }
  ];

  const commas = n => n.toLocaleString('en-US');

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

  const GRID_CY = P ? -1.05 : -0.53;
  const GRID_DX = P ? 0.52 : 0.51;
  const GRID_DY = P ? 0.39 : 0.29;

  const GRID_TOP = GRID_CY + 4.5 * GRID_DY;
  const GRID_BOTTOM = GRID_CY - 4.5 * GRID_DY;

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
    radius = 0.095, opacity = 0.18
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2,
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

  function parcel(x, y, color, size = 0.62) {
    return new M.VGroup(
      rect(
        size, size * 0.78,
        x, y,
        color, 0.15
      ),
      rect(
        size * 0.17, size * 0.78,
        x, y,
        color, 0.48, 1
      ),
      line(
        x - size / 2, y + size * 0.13,
        x + size / 2, y + size * 0.13,
        color, 1
      ),
      rect(
        size * 0.22, size * 0.16,
        x + size * 0.27, y - size * 0.20,
        color, 0.65, 1
      )
    );
  }

  function parcelWithDelay(d, x, y, size = 0.65) {
    return new M.VGroup(
      parcel(x, y, DC[d / 10], size),
      txt(
        `${d} min`,
        P ? 16 : 18,
        DC[d / 10],
        x, y - size * 0.82,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // Scene bookkeeping
  //
  // Never group objects that are already on screen.
  // Helpers only return animations, never call play().
  // ------------------------------------------------------------

  let visible = [];

  function add(...objects) {
    visible.push(...objects);
    return objects.map(o => new M.FadeIn(o));
  }

  function remove(...objects) {
    visible = visible.filter(o => !objects.includes(o));
    return objects.map(o => new M.FadeOut(o));
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

    const wd = Math.max(...widths) + 0.7;
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
    const maxh = P ? 1.40 : 3.5;

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
  // Simulation display helpers
  // ------------------------------------------------------------

  function gridPosition(k) {
    const col = k % 10;
    const row = Math.floor(k / 10);

    return [
      CX + (col - 4.5) * GRID_DX,
      GRID_TOP - row * GRID_DY
    ];
  }

  function runDot(x, y, late = false) {
    const color = late ? LATE : NOT_LATE;

    return glowDot(
      x, y,
      color,
      P ? 0.085 : 0.075,
      late ? 0.24 : 0.045
    );
  }

  function hundredDots() {
    return Array.from({ length: 100 }, (_, k) => {
      const [x, y] = gridPosition(k);
      return runDot(x, y, LATE100.has(k));
    });
  }

  function dotGridRows(dots) {
    return Array.from({ length: 10 }, (_, r) =>
      new M.VGroup(...dots.slice(r * 10, r * 10 + 10))
    );
  }

  // One small tile represents several parcels.
  // Red width is exactly proportional to the number of late parcels
  // in that tile. Cyan width represents all other parcels.
  function aggregateTile(count, groupSize, x, y) {
    const w = P ? 0.43 : 0.42;
    const h = P ? 0.25 : 0.20;

    const redW = w * count / groupSize;
    const cyanW = w - redW;

    const parts = [];

    if (cyanW > 0) {
      parts.push(
        rect(
          cyanW, h,
          x - w / 2 + cyanW / 2,
          y,
          NOT_LATE, 0.60, 0
        )
      );
    }

    if (redW > 0) {
      parts.push(
        rect(
          redW, h,
          x + w / 2 - redW / 2,
          y,
          LATE, 0.95, 0
        )
      );
    }

    const border = rect(
      w, h,
      x, y,
      C.muted, 0, 0.7
    );

    parts.push(border);

    return new M.VGroup(...parts);
  }

  function aggregateGrid(counts, groupSize) {
    return counts.map((count, k) => {
      const [x, y] = gridPosition(k);

      return aggregateTile(
        count, groupSize,
        x, y
      );
    });
  }

  function aggregateRows(counts, groupSize) {
    const tiles = aggregateGrid(counts, groupSize);

    return Array.from({ length: 10 }, (_, r) =>
      new M.VGroup(...tiles.slice(r * 10, r * 10 + 10))
    );
  }

  function sampleTitle(n) {
    return txt(
      `${commas(n)} SIMULATED PARCELS`,
      P ? 20 : 21,
      C.ink,
      CX,
      GRID_TOP + (P ? 0.73 : 0.46),
      true
    );
  }

  function sampleLegend(groupSize = 1) {
    return txt(
      groupSize === 1
        ? '1 dot = 1 parcel'
        : `1 tile = ${groupSize} parcels`,
      P ? 17 : 18,
      C.muted,
      CX,
      GRID_BOTTOM - 0.42,
      true
    );
  }

  function lateLegend() {
    const y = GRID_BOTTOM - (P ? 1.10 : 0.80);

    return new M.VGroup(
      glowDot(CX - 1.85, y, NOT_LATE, 0.075, 0.05),
      txt(
        'not late',
        P ? 18 : 17, C.muted,
        CX - 0.95, y
      ),
      glowDot(CX + 0.65, y, LATE, 0.075, 0.20),
      txt(
        '30 min late',
        P ? 18 : 17, LATE,
        CX + 1.90, y
      )
    );
  }

  // ============================================================
  // 0–2: The depot manager's question
  // ============================================================

  const initialParcelY = P ? -0.40 : -0.35;

  const questionParcel = parcel(
    CX, initialParcelY,
    LATE, 1.85
  );

  const questionLabel = txt(
    '30 minutes late',
    P ? 24 : 27,
    LATE,
    CX, initialParcelY - 1.30,
    true
  );

  const questionMark = txt(
    '?',
    49, C.amber,
    CX, initialParcelY + 1.15,
    true
  );

  // 0: What is the chance a parcel is thirty minutes late?
  await until(S(0));
  await play(
    ...add(questionParcel, questionLabel, questionMark),
    ...say('WHAT IS THE CHANCE OF A LATE PARCEL?', C.amber),
    ...fbox([
      'manager’s question:',
      ['chance of 30 min late?', C.amber]
    ], C.amber)
  );

  // 1: Define the event called "late".
  const definitionTag = tag(
    'LATE = 30 MINUTES',
    LATE,
    CX,
    P ? -2.90 : -2.35,
    20
  );

  await until(S(1));
  await play(
    ...remove(questionMark),
    ...add(definitionTag),
    new M.Indicate(questionParcel, { color: LATE }),
    ...say('LATE MEANS 30 MINUTES', LATE),
    ...fbox([
      ['event: late', LATE],
      'delay = 30 minutes'
    ], LATE)
  );

  // 2: One in ten in the shared chapter model.
  const MODEL_DELAYS = [
    0, 0, 0, 0,
    10, 10, 10,
    20, 20,
    30
  ];

  function modelPosition(k) {
    const cols = 5;
    const x = CX + (k % cols - 2) * (P ? 1.13 : 1.20);
    const y = (P ? 0.25 : 0.32) -
      Math.floor(k / cols) * (P ? 1.65 : 1.37);

    return [x, y];
  }

  const modelParcels = MODEL_DELAYS.map((d, k) => {
    const [x, y] = modelPosition(k);
    return parcelWithDelay(d, x, y, 0.62);
  });

  const trueChanceTag = tag(
    'TRUE CHANCE = 0.1',
    C.green,
    CX,
    P ? -3.12 : -2.43,
    20
  );

  await until(S(2));
  await play(
    ...swap([]),
    stagger(modelParcels, 1.7, 0.12),
    ...add(trueChanceTag),
    ...say('OUR MODEL: 1 IN 10 IS LATE', C.green),
    ...fbox([
      '1 late out of 10',
      ['true chance = 0.1', C.green]
    ], C.green)
  );

  // ============================================================
  // 3–5: Real systems are more complicated
  // ============================================================

  function truck(x, y, color) {
    const w1 = 0.75;
    const w2 = 0.35;

    return new M.VGroup(
      rect(w1, 0.40, x - 0.12, y, color, 0.22),
      rect(w2, 0.30, x + 0.43, y - 0.05, color, 0.30),
      glowDot(x - 0.35, y - 0.24, color, 0.07),
      glowDot(x + 0.42, y - 0.24, color, 0.07)
    );
  }

  const routeY = P ? -0.45 : -0.50;

  const roadNetwork = new M.VGroup(
    line(
      CX - 2.7, routeY + 1.20,
      CX + 2.7, routeY + 1.20,
      C.muted, 9
    ),
    line(
      CX - 2.7, routeY - 0.90,
      CX + 2.7, routeY - 0.90,
      C.muted, 9
    ),
    line(
      CX - 1.55, routeY + 1.20,
      CX - 1.55, routeY - 0.90,
      C.muted, 9
    ),
    line(
      CX + 1.55, routeY + 1.20,
      CX + 1.55, routeY - 0.90,
      C.muted, 9
    ),
    line(
      CX - 1.55, routeY,
      CX + 1.55, routeY,
      C.muted, 9
    )
  );

  const traffic = [
    truck(CX - 0.45, routeY + 1.20, DC[0]),
    truck(CX + 0.90, routeY + 1.20, DC[1]),
    truck(CX - 0.75, routeY - 0.90, DC[1]),
    truck(CX + 0.75, routeY - 0.90, DC[2]),
    truck(CX - 0.67, routeY, LATE),
    truck(CX + 0.55, routeY, LATE)
  ];

  const congestion = tag(
    'TRAFFIC JAM',
    LATE,
    CX,
    routeY + 0.60,
    15
  );

  // 3: Real depots have many interacting sources of uncertainty.
  await until(S(3));
  await play(
    ...swap([roadNetwork, congestion]),
    stagger(traffic, 1.8, 0.18),
    ...say('REAL DEPOTS ARE MESSY', C.amber),
    ...fbox([
      'many routes',
      'many drivers',
      ['many delays', C.amber]
    ], C.amber)
  );

  // 4: The chance may be too difficult to calculate on paper.
  const hardQuestion = tag(
    'CHANCE = ?',
    C.amber,
    CX,
    P ? -3.0 : -2.45,
    21
  );

  await until(S(4));
  await play(
    ...add(hardQuestion),
    ...say('TOO HARD TO WORK OUT ON PAPER', C.amber),
    ...fbox([
      'many possibilities',
      ['exact calculation?', C.amber]
    ], C.amber)
  );

  // 5: Hide the known answer temporarily.
  // Keep it available as a benchmark for checking the estimate.
  const knownCardY = P ? -0.15 : -0.35;

  const knownCard = new M.VGroup(
    rounded(
      P ? 4.75 : 5.0,
      2.40,
      CX, knownCardY,
      C.green
    ),
    txt(
      'KNOWN MODEL ANSWER',
      19, C.muted,
      CX, knownCardY + 0.77,
      true
    ),
    txt(
      '0.1',
      49, C.green,
      CX, knownCardY + 0.04,
      true
    ),
    txt(
      'Use it to check our method',
      17, C.ink,
      CX, knownCardY - 0.78
    )
  );

  const hiddenCard = new M.VGroup(
    rounded(
      P ? 4.75 : 5.0,
      2.40,
      CX, knownCardY,
      C.amber
    ),
    txt(
      'PRETEND WE DO NOT KNOW',
      18, C.muted,
      CX, knownCardY + 0.77,
      true
    ),
    txt(
      '?',
      49, C.amber,
      CX, knownCardY + 0.04,
      true
    ),
    txt(
      'Find the chance by simulation',
      17, C.ink,
      CX, knownCardY - 0.78
    )
  );

  await until(S(5));
  await play(
    ...swap([knownCard]),
    ...say('LET US FIND IT ANOTHER WAY', C.violet),
    ...fbox([
      ['true chance = 0.1', C.green],
      'keep it for checking'
    ], C.green)
  );

  await until(S(5) + 2.3);

  await play(
    ...remove(knownCard),
    ...add(hiddenCard),
    ...fbox([
      ['unknown chance = ?', C.amber],
      'estimate from pretend data'
    ], C.amber)
  );

  // ============================================================
  // 6–8: The simulation recipe
  // ============================================================

  const FLOW_Y = P ? -0.40 : -0.55;
  const FLOW_SP = P ? 2.10 : 2.25;
  const FLOW_W = P ? 1.82 : 1.95;

  function flowCard(title, sub, x, y, color) {
    return new M.VGroup(
      rounded(
        FLOW_W, 1.45,
        x, y,
        color
      ),
      txt(
        title, 18, color,
        x, y + 0.28,
        true, FLOW_W - 0.14
      ),
      txt(
        sub, 15, C.ink,
        x, y - 0.29,
        false, FLOW_W - 0.16
      )
    );
  }

  const planCards = [
    flowCard(
      'SIMULATE',
      'many parcels',
      CX - FLOW_SP, FLOW_Y,
      C.cyan
    ),
    flowCard(
      'COUNT',
      'late parcels',
      CX, FLOW_Y,
      LATE
    ),
    flowCard(
      'DIVIDE',
      'late ÷ all',
      CX + FLOW_SP, FLOW_Y,
      C.green
    )
  ];

  const planArrows = [
    arrow(
      CX - FLOW_SP + FLOW_W / 2 + 0.03,
      FLOW_Y,
      CX - FLOW_W / 2 - 0.03,
      FLOW_Y,
      C.muted
    ),
    arrow(
      CX + FLOW_W / 2 + 0.03,
      FLOW_Y,
      CX + FLOW_SP - FLOW_W / 2 - 0.03,
      FLOW_Y,
      C.muted
    )
  ];

  // 6: Simulate many parcels and count the late ones.
  await until(S(6));
  await play(
    ...swap([]),
    stagger(planCards.slice(0, 2), 1.5, 0.24),
    ...add(planArrows[0]),
    ...say('SIMULATE MANY PARCELS. COUNT THE LATE ONES.'),
    ...fbox([
      'simulate many parcels',
      ['count 30-minute delays', LATE]
    ])
  );

  // 7: One simulated parcel is called one run.
  const runY = P ? -0.40 : -0.45;

  const oneParcel = parcel(CX - 1.65, runY, C.cyan, 1.15);

  const runEquals = txt(
    '=',
    33, C.muted,
    CX, runY,
    true
  );

  const oneRun = new M.VGroup(
    rounded(
      2.10, 1.10,
      CX + 1.65, runY,
      C.cyan
    ),
    txt(
      '1 RUN',
      24, C.cyan,
      CX + 1.65, runY,
      true
    )
  );

  const runCaption = txt(
    'One pretend parcel',
    21, C.ink,
    CX,
    P ? -2.05 : -1.87
  );

  await until(S(7));
  await play(
    ...swap([
      oneParcel,
      runEquals,
      oneRun,
      runCaption
    ]),
    ...say('1 RUN = 1 PRETEND PARCEL'),
    ...fbox([
      ['run = one simulation', C.cyan],
      'here: one parcel'
    ])
  );

  // 8: A uniform draw becomes a delay using the shared ruler.
  const RW = P ? 6.10 : 6.55;
  const RY = P ? -0.55 : -0.42;
  const RH = P ? 0.55 : 0.55;

  const ux = v => CX - RW / 2 + v * RW;

  function colouredRuler() {
    const parts = [];

    for (let k = 0; k < 4; k++) {
      const a = CUTS[k];
      const b = CUTS[k + 1];
      const x = ux((a + b) / 2);
      const w = RW * (b - a);

      parts.push(
        rect(
          w, RH,
          x, RY,
          DC[k], 0.55, 1.5
        ),
        txt(
          D[k],
          P ? 19 : 21,
          C.ink,
          x, RY,
          true, w - 0.10
        )
      );
    }

    CUTS.forEach(v => {
      parts.push(
        line(
          ux(v), RY - RH / 2 - 0.08,
          ux(v), RY + RH / 2 + 0.08,
          C.muted, 1.5
        ),
        txt(
          v === 0 ? '0' : v.toFixed(1),
          P ? 15 : 17,
          C.muted,
          ux(v), RY - RH / 2 - 0.29,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const samplingRuler = colouredRuler();

  // The exact first draw from NumPy default_rng(39).
  const FIRST_U = 0.5017119571514081;
  const FIRST_DELAY = delayOf(FIRST_U);

  const drawY = RY + RH / 2 + 0.57;

  const firstDrawMarker = new M.VGroup(
    glowDot(
      ux(FIRST_U), drawY,
      C.cyan, 0.10
    ),
    arrow(
      ux(FIRST_U), drawY - 0.12,
      ux(FIRST_U), RY + RH / 2 + 0.04,
      C.cyan
    ),
    txt(
      '0.502',
      19, C.cyan,
      ux(FIRST_U), drawY + 0.31,
      true
    )
  );

  const firstDrawResult = new M.VGroup(
    parcel(
      CX, P ? -2.45 : -1.85,
      DC[FIRST_DELAY / 10],
      0.72
    ),
    txt(
      '10 minutes → not late',
      P ? 18 : 19,
      DC[1],
      CX, P ? -3.10 : -2.50
    )
  );

  await until(S(8));
  await play(
    ...swap([samplingRuler]),
    ...say('DRAW A NUMBER. READ ITS DELAY.'),
    ...fbox([
      ['seed = 39', C.amber],
      'one uniform draw',
      'one parcel delay'
    ])
  );

  await until(S(8) + 2.2);

  await play(
    ...add(firstDrawMarker),
    ...fbox([
      ['draw ≈ 0.502', C.cyan],
      '0.4 ≤ draw < 0.7',
      ['delay = 10 min', DC[1]]
    ], DC[1])
  );

  await until(S(8) + 4.9);

  await play(
    ...add(firstDrawResult),
    ...fbox([
      'delay = 10 minutes',
      ['late? NO', NOT_LATE]
    ])
  );

  // ============================================================
  // 9–14: Simulate 100 parcels and estimate the chance
  // ============================================================

  const dots100 = hundredDots();

  // Group by rows before displaying, for efficient rendering.
  const rows100 = dotGridRows(dots100);

  const title100 = sampleTitle(100);
  const legend100 = sampleLegend(1);
  const legendLate100 = lateLegend();

  // 9: Every dot is one parcel. Late parcels glow red.
  await until(S(9));
  await play(
    ...swap([
      title100,
      legend100,
      legendLate100
    ]),
    stagger(rows100, 3.5, 0.19),
    ...say('SIMULATE 100 PARCELS'),
    ...fbox([
      ['seed = 39', C.amber],
      'runs = 100',
      ['red = late', LATE]
    ])
  );

  // 10: Twelve of the hundred are late.
  const lateFrames = [...LATE100].map(k => {
    const [x, y] = gridPosition(k);

    return outline(
      P ? 0.32 : 0.29,
      P ? 0.32 : 0.27,
      x, y,
      LATE
    );
  });

  await until(S(10));
  await play(
    ...add(...lateFrames),
    ...say('12 OF THE 100 ARE LATE', LATE),
    ...fbox([
      'runs = 100',
      ['late = 12', LATE]
    ], LATE)
  );

  // 11: Twelve out of one hundred.
  await until(S(11));
  await play(
    ...say('OUR GUESS: 12 OUT OF 100', C.amber),
    ...fbox([
      ['late parcels = 12', LATE],
      'all parcels = 100',
      ['chance ≈ 12/100', C.amber]
    ], C.amber)
  );

  // 12: 12 divided by 100 equals 0.12.
  await until(S(12));
  await play(
    ...say('12 ÷ 100 = 0.12', C.green),
    ...fbox([
      ['12 ÷ 100', C.ink],
      ['= 0.12', C.green],
      '12 percent'
    ], C.green)
  );

  // 13: A guess calculated from data is called an estimate.
  await until(S(13));
  await play(
    ...remove(...lateFrames),
    ...say('ESTIMATE = A GUESS MADE FROM DATA', C.violet),
    ...fbox([
      ['estimate = 0.12', C.violet],
      'calculated from',
      'our simulated data'
    ], C.violet)
  );

  // 14: Compare the estimate with the known true chance.
  await until(S(14));
  await play(
    ...say('CLOSE TO THE TRUTH, NOT EXACT', C.amber),
    ...fbox([
      ['estimate = 0.12', C.cyan],
      ['truth    = 0.10', C.green],
      ['gap      = 0.02', C.amber]
    ], C.amber)
  );

  // ============================================================
  // 15–20: Increase the number of simulated parcels
  // ============================================================

  const rows1000 = aggregateRows(GROUP10, 10);
  const title1000 = sampleTitle(1000);
  const legend1000 = sampleLegend(10);
  const legendLate1000 = lateLegend();

  // 15: Extend the same simulation to 1,000 parcels.
  // This includes the original 100 draws.
  await until(S(15));
  await play(
    ...swap([
      title1000,
      legend1000,
      legendLate1000
    ]),
    stagger(rows1000, 1.55, 0.12),
    ...say('MORE RUNS: 1,000 PARCELS'),
    ...fbox([
      ['same seed = 39', C.amber],
      'continue the sequence',
      'runs = 1,000'
    ])
  );

  // 16: 99 of 1,000 are late.
  await until(S(16));
  await play(
    ...say('99 LATE OUT OF 1,000', LATE),
    ...fbox([
      ['late = 99', LATE],
      'runs = 1,000',
      ['99 ÷ 1,000 = 0.099', C.green]
    ], C.green)
  );

  await until(S(16) + 3.3);

  await play(
    ...fbox([
      ['estimate = 0.099', C.cyan],
      ['truth    = 0.100', C.green],
      ['gap      = 0.001', C.amber]
    ], C.green)
  );

  // 17: Closer.
  await until(S(17));
  await play(
    new M.Indicate(boxNow, {
      color: C.green,
      runTime: 0.45
    })
  );

  const rows10000 = aggregateRows(GROUP100, 100);
  const title10000 = sampleTitle(10000);
  const legend10000 = sampleLegend(100);
  const legendLate10000 = lateLegend();

  // 18: Extend the same simulation to 10,000 parcels.
  await until(S(18));
  await play(
    ...swap([
      title10000,
      legend10000,
      legendLate10000
    ]),
    stagger(rows10000, 1.25, 0.09),
    ...say('NOW 10,000 PARCELS'),
    ...fbox([
      ['same seed = 39', C.amber],
      'runs = 10,000'
    ])
  );

  // 19: 991 of 10,000 are late.
  await until(S(19));
  await play(
    ...say('991 LATE OUT OF 10,000', LATE),
    ...fbox([
      ['late = 991', LATE],
      'runs = 10,000',
      ['991 ÷ 10,000 = 0.0991', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // Comparison picture: all estimates on a common horizontal scale.
  // ------------------------------------------------------------

  const COMP_W = P ? 5.65 : 6.10;
  const COMP_MIN = 0.075;
  const COMP_MAX = 0.125;

  const compX = v =>
    CX - COMP_W / 2 +
    (v - COMP_MIN) / (COMP_MAX - COMP_MIN) * COMP_W;

  const compRowsY = P
    ? [0.35, -1.20, -2.75]
    : [0.43, -0.82, -2.04];

  const compTop = compRowsY[0] + 0.48;
  const compBottom = compRowsY[2] - 0.28;

  const truthLine = new M.DashedLine({
    start: [compX(TRUE_P), compBottom, 0],
    end: [compX(TRUE_P), compTop, 0],
    color: C.green
  });

  const truthLabel = tag(
    'TRUE 0.1',
    C.green,
    compX(TRUE_P),
    compTop + 0.35,
    16
  );

  function comparisonRow(result, k) {
    const y = compRowsY[k];

    const xTrue = compX(TRUE_P);
    const xEstimate = compX(result.estimate);

    const parts = [
      line(
        compX(COMP_MIN), y,
        compX(COMP_MAX), y,
        C.muted, 1.8
      ),
      line(
        xTrue, y,
        xEstimate, y,
        C.amber, 4
      ),
      glowDot(
        xTrue, y,
        C.green, 0.075
      ),
      glowDot(
        xEstimate, y,
        C.cyan, 0.085
      ),
      txt(
        `${commas(result.n)} runs`,
        P ? 17 : 18,
        C.muted,
        compX(COMP_MIN) + 0.78,
        y + 0.36,
        true
      ),
      txt(
        result.label,
        P ? 18 : 19,
        C.cyan,
        compX(COMP_MAX) - 0.45,
        y + 0.36,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const compRows = RESULTS.map(comparisonRow);

  const compAxisLabels = [
    txt(
      '0.075',
      P ? 17 : 17, C.muted,
      compX(COMP_MIN),
      compBottom - 0.30,
      true
    ),
    txt(
      '0.125',
      P ? 17 : 17, C.muted,
      compX(COMP_MAX),
      compBottom - 0.30,
      true
    )
  ];

  // 20: 0.0991 is very close to 0.1.
  await until(S(20));
  await play(
    ...swap([
      truthLine,
      truthLabel,
      ...compAxisLabels,
      ...compRows
    ]),
    ...say('VERY CLOSE TO THE TRUE CHANCE', C.green),
    ...fbox([
      ['estimate = 0.0991', C.cyan],
      ['truth    = 0.1000', C.green],
      ['gap      = 0.0009', C.amber]
    ], C.green)
  );

  // ============================================================
  // 21–24: Name the method — Monte Carlo
  // ============================================================

  // 21: More runs improved this particular estimate.
  // This is not a guarantee of monotonic improvement on every run.
  await until(S(21));
  await play(
    new M.LaggedStart(
      compRows.map(r =>
        new M.Indicate(r, { color: C.green })
      ),
      { lagRatio: 0.18, runTime: 1.6 }
    ),
    ...say('MORE RUNS GAVE A CLOSER ESTIMATE', C.green),
    ...fbox([
      '100 runs:    0.12',
      '1,000 runs:  0.099',
      ['10,000:      0.0991', C.green]
    ], C.green)
  );

  // 22: The method is called a Monte Carlo estimate.
  const monteName = new M.VGroup(
    txt(
      'MONTE CARLO',
      P ? 34 : 36,
      C.violet,
      CX, P ? 0.45 : 0.32,
      true
    ),
    txt(
      'ESTIMATE',
      P ? 30 : 32,
      C.violet,
      CX, P ? -0.31 : -0.39,
      true
    ),
    txt(
      'Use repeated chance to estimate a chance',
      P ? 19 : 20,
      C.ink,
      CX, P ? -1.52 : -1.52
    )
  );

  await until(S(22));
  await play(
    ...swap([monteName]),
    ...say('MONTE CARLO ESTIMATE', C.violet),
    ...fbox([
      ['Monte Carlo', C.violet],
      'estimate using',
      'many simulated runs'
    ], C.violet)
  );

  // 23: The name recalls games of chance in Monte Carlo.
  function die(x, y, faces, color = C.violet) {
    const offsets = {
      1: [[0, 0]],
      2: [[-0.24, 0.24], [0.24, -0.24]],
      3: [[-0.24, 0.24], [0, 0], [0.24, -0.24]],
      4: [
        [-0.24, -0.24],
        [-0.24, 0.24],
        [0.24, -0.24],
        [0.24, 0.24]
      ],
      5: [
        [-0.24, -0.24],
        [-0.24, 0.24],
        [0, 0],
        [0.24, -0.24],
        [0.24, 0.24]
      ],
      6: [
        [-0.24, -0.27],
        [-0.24, 0],
        [-0.24, 0.27],
        [0.24, -0.27],
        [0.24, 0],
        [0.24, 0.27]
      ]
    };

    return new M.VGroup(
      rounded(1.08, 1.08, x, y, color),
      ...offsets[faces].map(([dx, dy]) =>
        glowDot(
          x + dx, y + dy,
          color, 0.065, 0.10
        )
      )
    );
  }

  const dice = [
    die(CX - 0.75, P ? -0.05 : -0.20, 3),
    die(CX + 0.75, P ? -0.05 : -0.20, 6)
  ];

  const casinoLabel = txt(
    'Monte Carlo, Monaco',
    23, C.ink,
    CX, P ? 1.14 : 0.99
  );

  const casinoNote = txt(
    'A name associated with games of chance',
    P ? 18 : 19,
    C.muted,
    CX, P ? -1.48 : -1.45
  );

  await until(S(23));
  await play(
    ...swap([
      casinoLabel,
      ...dice,
      casinoNote
    ]),
    ...say('NAMED AFTER MONTE CARLO', C.violet),
    ...fbox([
      'Monte Carlo, Monaco',
      ['games of chance', C.violet]
    ], C.violet)
  );

  // 24: Repeat a game many times and count the outcome of interest.
  // Illustrative dice results, not the parcel simulation.
  const diceResults = [2, 6, 1, 4, 3, 5, 6, 2, 3, 1];

  const littleDice = diceResults.map((v, k) => {
    const x = CX + (k % 5 - 2) * (P ? 1.12 : 1.20);
    const y = (P ? 0.36 : 0.38) -
      Math.floor(k / 5) * (P ? 1.42 : 1.31);

    const color = v === 6 ? C.amber : C.muted;

    return new M.VGroup(
      rounded(0.90, 0.90, x, y, color),
      txt(
        v, 28, color,
        x, y,
        true
      )
    );
  });

  const gameCount = tag(
    'COUNT THE OUTCOME YOU CARE ABOUT',
    C.amber,
    CX,
    P ? -2.60 : -2.28,
    16
  );

  await until(S(24));
  await play(
    ...swap([]),
    stagger(littleDice, 2.3, 0.17),
    ...add(gameCount),
    ...say('PLAY MANY TIMES, THEN COUNT'),
    ...fbox([
      'repeat the game',
      ['count the event', C.amber]
    ])
  );

  // ============================================================
  // 25–30: The three-step recipe
  // ============================================================

  const STEP_W = P ? 5.75 : 5.85;
  const STEP_H = P ? 0.97 : 0.83;

  const stepYs = P
    ? [0.87, -0.73, -2.33]
    : [0.78, -0.60, -1.98];

  function stepCard(n, title, detail, y, color) {
    const left = CX - STEP_W / 2;

    return new M.VGroup(
      rounded(
        STEP_W, STEP_H,
        CX, y,
        color
      ),
      glowDot(
        left + 0.44, y,
        color, 0.14
      ),
      txt(
        n, 18, C.ink,
        left + 0.44, y,
        true
      ),
      txt(
        title,
        P ? 20 : 21,
        color,
        CX + 0.20, y + 0.18,
        true,
        STEP_W - 1.20
      ),
      txt(
        detail,
        P ? 16 : 17,
        C.ink,
        CX + 0.20, y - 0.20,
        false,
        STEP_W - 1.20
      )
    );
  }

  const steps = [
    stepCard(
      '1',
      'SIMULATE',
      'Many independent runs',
      stepYs[0],
      C.cyan
    ),
    stepCard(
      '2',
      'COUNT',
      'Runs where the event happens',
      stepYs[1],
      LATE
    ),
    stepCard(
      '3',
      'DIVIDE',
      'Event count ÷ all runs',
      stepYs[2],
      C.green
    )
  ];

  const stepArrows = [
    arrow(
      CX, stepYs[0] - STEP_H / 2 - 0.04,
      CX, stepYs[1] + STEP_H / 2 + 0.04,
      C.muted
    ),
    arrow(
      CX, stepYs[1] - STEP_H / 2 - 0.04,
      CX, stepYs[2] + STEP_H / 2 + 0.04,
      C.muted
    )
  ];

  const stepSlots = stepYs.map((y, k) =>
    new M.VGroup(
      outline(STEP_W, STEP_H, CX, y, C.muted),
      txt(String(k + 1), 20, C.muted, CX - STEP_W / 2 + 0.44, y, true),
      txt(['SIMULATE', 'COUNT', 'DIVIDE'][k], P ? 20 : 21, C.muted, CX + 0.20, y, true)
    )
  );

  // 25: Three steps in plain words.
  await until(S(25));
  await play(
    ...swap([...stepSlots]),
    ...say('THREE SIMPLE STEPS', C.violet),
    ...clearBox()
  );

  // 26: Independent runs.
  await until(S(26));
  await play(
    ...remove(stepSlots[0]),
    ...add(steps[0]),
    ...say('STEP 1: SIMULATE INDEPENDENT RUNS'),
    ...fbox([
      ['independent runs', C.cyan],
      'one parcel does not',
      'affect another'
    ])
  );

  // 27: Count the event of interest.
  await until(S(27));
  await play(
    ...remove(stepSlots[1]),
    ...add(stepArrows[0], steps[1]),
    ...say('STEP 2: COUNT THE EVENT', LATE),
    ...fbox([
      'event = what we care about',
      ['here: a 30-minute delay', LATE]
    ], LATE)
  );

  // 28: Divide the event count by the total run count.
  await until(S(28));
  await play(
    ...remove(stepSlots[2]),
    ...add(stepArrows[1], steps[2]),
    ...say('STEP 3: DIVIDE BY ALL RUNS', C.green),
    ...fbox([
      'event count',
      ['÷ number of runs', C.green]
    ], C.green)
  );

  // 29: The short formula, shown as a fraction.
  const FRACTION_Y = P ? -0.40 : -0.55;
  const FRACTION_W = P ? 5.55 : 6.25;

  const estimateHeading = txt(
    'ESTIMATED CHANCE',
    P ? 25 : 28,
    C.green,
    CX,
    FRACTION_Y + 1.40,
    true
  );

  const fractionBar = line(
    CX - FRACTION_W / 2,
    FRACTION_Y,
    CX + FRACTION_W / 2,
    FRACTION_Y,
    C.ink, 3
  );

  const numerator = txt(
    'runs where the event happens',
    P ? 22 : 23,
    LATE,
    CX,
    FRACTION_Y + 0.43
  );

  const denominator = txt(
    'total number of runs',
    P ? 22 : 23,
    C.cyan,
    CX,
    FRACTION_Y - 0.43
  );

  const fractionEquals = txt(
    '=',
    24, C.muted,
    CX,
    FRACTION_Y + 0.89,
    true
  );

  await until(S(29));
  await play(
    ...swap([
      estimateHeading,
      fractionEquals,
      numerator,
      fractionBar,
      denominator
    ]),
    ...say('ESTIMATE = EVENT COUNT ÷ RUN COUNT', C.green),
    ...fbox([
      ['estimated chance', C.green],
      'event count ÷ all runs'
    ], C.green)
  );

  // 30: Substitute 12 and 100.
  const numerator12 = txt(
    '12 late parcels',
    P ? 26 : 28,
    LATE,
    CX,
    FRACTION_Y + 0.43,
    true
  );

  const denominator100 = txt(
    '100 simulated parcels',
    P ? 24 : 26,
    C.cyan,
    CX,
    FRACTION_Y - 0.43,
    true
  );

  const result012 = tag(
    '= 0.12',
    C.green,
    CX,
    P ? -2.42 : -2.30,
    24
  );

  await until(S(30));
  await play(
    ...remove(numerator, denominator),
    ...add(numerator12, denominator100, result012),
    ...say('12 ÷ 100 = 0.12', C.green),
    ...fbox([
      ['event count = 12', LATE],
      'run count = 100',
      ['estimate = 0.12', C.green]
    ], C.green)
  );

  // ============================================================
  // 31–33: What is it for? More complicated chance questions.
  // ============================================================

  // 31: Monte Carlo can estimate difficult probabilities.
  const difficultCardY = P ? -0.38 : -0.48;

  const difficultCard = new M.VGroup(
    rounded(
      P ? 5.7 : 6.2,
      2.35,
      CX, difficultCardY,
      C.violet
    ),
    txt(
      'A COMPLICATED CHANCE',
      P ? 21 : 23,
      C.violet,
      CX, difficultCardY + 0.76,
      true
    ),
    txt(
      '?',
      49, C.amber,
      CX, difficultCardY - 0.01,
      true
    ),
    txt(
      'Simulate instead of solving by hand',
      P ? 18 : 19,
      C.ink,
      CX, difficultCardY - 0.78
    )
  );

  await until(S(31));
  await play(
    ...swap([difficultCard]),
    ...say('ANSWER DIFFICULT CHANCE QUESTIONS', C.violet),
    ...fbox([
      'too hard on paper?',
      ['simulate and count', C.green]
    ], C.violet)
  );

  // 32: Chance that a whole day accumulates over 60 minutes.
  // A five-parcel miniature day is an illustrative example.
  const dayDelays = [30, 0, 20, 10, 20];

  const dayParcelY = P ? 0.14 : -0.05;

  const dayParcels = dayDelays.map((d, k) =>
    parcelWithDelay(
      d,
      CX + (k - 2) * (P ? 1.14 : 1.19),
      dayParcelY,
      0.72
    )
  );

  const dayHeading = txt(
    'ONE PRETEND DAY',
    20, C.muted,
    CX, dayParcelY + 0.91,
    true
  );

  const dayTotal = txt(
    '30 + 0 + 20 + 10 + 20 = 80',
    P ? 21 : 22,
    C.amber,
    CX,
    P ? -1.67 : -1.46,
    true
  );

  const badDay = tag(
    '80 > 60 MINUTES',
    LATE,
    CX,
    P ? -2.78 : -2.43,
    20
  );

  await until(S(32));
  await play(
    ...swap([dayHeading]),
    stagger(dayParcels, 1.7, 0.17),
    ...say('CHANCE OF OVER AN HOUR OF DELAY?', C.amber),
    ...fbox([
      'event:',
      ['total daily delay > 60', LATE]
    ], C.amber)
  );

  await until(S(32) + 2.5);

  await play(
    ...add(dayTotal, badDay),
    ...fbox([
      'one illustrative day',
      'total = 80 minutes',
      ['80 > 60: event happens', LATE]
    ], LATE)
  );

  // 33: Simulate many days, count the bad days, and divide.
  // These six daily totals illustrate the procedure only.
  // They are not the seed-39 parcel-chance experiment.
  const illustrativeDays = [40, 70, 50, 90, 60, 80];

  function dayTile(total, k) {
    const x = CX + (k % 3 - 1) * (P ? 1.94 : 2.05);
    const y = (P ? 0.40 : 0.46) -
      Math.floor(k / 3) * (P ? 1.62 : 1.42);

    const bad = total > 60;
    const color = bad ? LATE : C.cyan;
    const width = P ? 1.70 : 1.80;

    return new M.VGroup(
      rounded(
        width, 1.18,
        x, y,
        color,
        color, 0.08
      ),
      txt(
        `DAY ${k + 1}`,
        14, C.muted,
        x, y + 0.36,
        true
      ),
      txt(
        `${total} min`,
        P ? 21 : 22,
        color,
        x, y - 0.02,
        true,
        width - 0.12
      ),
      txt(
        bad ? 'OVER 60' : 'NOT OVER 60',
        12, color,
        x, y - 0.40,
        true,
        width - 0.12
      )
    );
  }

  const dayTiles = illustrativeDays.map(dayTile);

  const dayExampleLabel = txt(
    'Illustrative daily totals',
    17, C.muted,
    CX,
    P ? -2.92 : -2.46
  );

  await until(S(33));
  await play(
    ...swap([dayExampleLabel]),
    stagger(dayTiles, 2.1, 0.17),
    ...say('SIMULATE DAYS. COUNT. DIVIDE.', C.green),
    ...fbox([
      ['bad days = 3', LATE],
      'all days = 6',
      ['illustration: 3/6', C.green]
    ], C.green)
  );

  // ============================================================
  // 34–38: Common trap — trusting too few runs
  // ============================================================

  // 34: Small samples can give misleading estimates.
  const SMALL_Y = P ? -0.35 : -0.50;

  const smallSample = Array.from({ length: 10 }, (_, k) =>
    runDot(
      CX + (k % 5 - 2) * (P ? 0.95 : 1.0),
      SMALL_Y + 0.49 - Math.floor(k / 5) * 0.83,
      false
    )
  );

  const smallSampleLabel = txt(
    'Only 10 runs',
    24, C.amber,
    CX, SMALL_Y + 1.14,
    true
  );

  const smallWarning = tag(
    'VERY LITTLE EVIDENCE',
    C.amber,
    CX,
    P ? -2.45 : -2.12,
    19
  );

  await until(S(34));
  await play(
    ...swap([smallSampleLabel]),
    stagger(smallSample, 1.45, 0.12),
    ...add(smallWarning),
    ...say('TRAP: TOO FEW RUNS', C.amber),
    ...fbox([
      'few runs',
      ['estimate can be far off', C.amber]
    ], C.amber)
  );

  // 35: Recall the actual estimate from the first 100 runs.
  const trapDots100 = hundredDots();
  const trapRows100 = dotGridRows(trapDots100);

  const trapTitle100 = sampleTitle(100);
  const trapLegend100 = sampleLegend(1);
  const trapLateLegend100 = lateLegend();

  await until(S(35));
  await play(
    ...swap([
      trapTitle100,
      trapLegend100,
      trapLateLegend100
    ]),
    stagger(trapRows100, 1.7, 0.10),
    ...say('100 RUNS GAVE 12%, NOT 10%', C.amber),
    ...fbox([
      ['estimate = 0.12', C.cyan],
      ['truth    = 0.10', C.green],
      ['difference = 0.02', C.amber]
    ], C.amber)
  );

  // 36: Ten runs can contain no late parcels.
  // Runs 21–30 of the seed-39 sequence actually contain zero late.
  const noLateDots = Array.from({ length: 10 }, (_, k) => {
    const x = CX + (k % 5 - 2) * (P ? 1.02 : 1.06);
    const y = (P ? 0.10 : 0.14) -
      Math.floor(k / 5) * 0.92;

    return new M.VGroup(
      runDot(x, y, false),
      txt(
        k + 1,
        13, C.muted,
        x, y - 0.27,
        true
      )
    );
  });

  const noLateTitle = txt(
    '10 RUNS · NO LATE PARCELS',
    P ? 20 : 21,
    C.ink,
    CX,
    P ? 1.05 : 1.02,
    true
  );

  const noLateChance = tag(
    'ABOUT 1 TIME IN 3',
    C.amber,
    CX,
    P ? -2.65 : -2.33,
    20
  );

  await until(S(36));
  await play(
    ...swap([noLateTitle]),
    stagger(noLateDots, 1.45, 0.12),
    ...say('10 RUNS MAY CONTAIN ZERO LATE PARCELS', C.amber),
    ...fbox([
      'chance of no late parcel',
      '0.9 × 0.9 × ... × 0.9',
      ['0.9¹⁰ ≈ 0.35', C.amber]
    ], C.amber)
  );

  await until(S(36) + 2.2);

  await play(
    ...add(noLateChance)
  );

  // 37: The incorrect conclusion would be that late never happens.
  const wrongConclusionY = P ? -3.72 : -2.32;

  const wrongConclusion = new M.VGroup(
    rounded(
      P ? 5.40 : 5.85,
      0.78,
      CX, wrongConclusionY,
      LATE
    ),
    txt(
      '“LATE PARCELS NEVER HAPPEN”',
      P ? 18 : 20,
      LATE,
      CX, wrongConclusionY,
      true,
      P ? 5.12 : 5.57
    ),
    line(
      CX - (P ? 2.48 : 2.62),
      wrongConclusionY - 0.23,
      CX + (P ? 2.48 : 2.62),
      wrongConclusionY + 0.23,
      LATE, 3
    )
  );

  await until(S(37));
  await play(
    ...remove(noLateChance),
    ...add(wrongConclusion),
    ...say('ZERO OBSERVED DOES NOT MEAN IMPOSSIBLE', LATE),
    ...fbox([
      ['estimate = 0/10 = 0', C.amber],
      ['true chance = 0.1', C.green],
      ['zero is misleading here', LATE]
    ], LATE)
  );

  // 38: Always ask how many runs were used.
  const SIZE_ROWS = [
    ['10', '0', C.amber],
    ['100', '0.12', C.cyan],
    ['1,000', '0.099', C.cyan],
    ['10,000', '0.0991', C.green]
  ];

  const TABLE_Y = P ? 0.44 : 0.59;
  const TABLE_PITCH = P ? 0.95 : 0.73;

  const tableLeft = CX - (P ? 1.30 : 1.60);
  const tableRight = CX + (P ? 1.30 : 1.60);

  const sizeHead = new M.VGroup(
    txt(
      'RUNS',
      18, C.muted,
      tableLeft, TABLE_Y + 0.66,
      true
    ),
    txt(
      'ESTIMATE',
      18, C.muted,
      tableRight, TABLE_Y + 0.66,
      true
    ),
    line(
      CX - 2.75, TABLE_Y + 0.38,
      CX + 2.75, TABLE_Y + 0.38,
      C.muted, 1.5
    )
  );

  const sizeRows = SIZE_ROWS.map(([n, estimate, color], k) => {
    const y = TABLE_Y - k * TABLE_PITCH;

    return new M.VGroup(
      rounded(
        P ? 5.50 : 5.80,
        P ? 0.70 : 0.59,
        CX, y,
        color,
        color, 0.045
      ),
      txt(
        n, P ? 21 : 22,
        C.ink,
        tableLeft, y,
        true
      ),
      txt(
        estimate, P ? 21 : 22,
        color,
        tableRight, y,
        true
      )
    );
  });

  const runCountWarning = tag(
    'ALWAYS REPORT THE NUMBER OF RUNS',
    C.amber,
    CX,
    P ? -3.70 : -2.63,
    16
  );

  await until(S(38));
  await play(
    ...swap([sizeHead]),
    stagger(sizeRows, 2.1, 0.18),
    ...add(runCountWarning),
    ...say('HOW MANY RUNS DID YOU USE?', C.amber),
    ...fbox([
      'report the estimate',
      ['and the run count', C.amber],
      'later: measure its error'
    ], C.amber)
  );

  // ============================================================
  // 39: Final one-picture summary
  // ============================================================

  const FINAL_Y = P ? 0.42 : 0.49;
  const FINAL_GRID_DX = P ? 0.44 : 0.45;
  const FINAL_GRID_DY = P ? 0.27 : 0.20;

  const finalDots = Array.from({ length: 100 }, (_, k) => {
    const col = k % 10;
    const row = Math.floor(k / 10);

    const x = CX + (col - 4.5) * FINAL_GRID_DX;
    const y = FINAL_Y - row * FINAL_GRID_DY;

    const late = LATE100.has(k);

    return glowDot(
      x, y,
      late ? LATE : NOT_LATE,
      P ? 0.068 : 0.061,
      late ? 0.24 : 0.045
    );
  });

  const finalRows = dotGridRows(finalDots);

  const finalTitle = txt(
    'SIMULATE 100 PARCELS',
    P ? 21 : 22,
    C.cyan,
    CX,
    FINAL_Y + 0.61,
    true
  );

  const finalFractionY = P ? -3.18 : -1.94;

  const finalNumerator = txt(
    '12 late',
    P ? 25 : 24,
    LATE,
    CX,
    finalFractionY + 0.33,
    true
  );

  const finalFractionBar = line(
    CX - 1.24, finalFractionY,
    CX + 1.24, finalFractionY,
    C.ink, 2.5
  );

  const finalDenominator = txt(
    '100 runs',
    P ? 23 : 22,
    C.cyan,
    CX,
    finalFractionY - 0.32,
    true
  );

  const finalResult = tag(
    'ESTIMATE = 0.12',
    C.green,
    CX,
    P ? -4.55 : -2.70,
    20
  );

  await until(S(39));
  await play(
    ...swap([finalTitle]),
    stagger(finalRows, 1.7, 0.12),
    ...say('1. SIMULATE MANY RUNS'),
    ...fbox([
      ['1. simulate', C.cyan],
      'many independent runs'
    ])
  );

  await until(S(39) + 2.3);

  await play(
    ...add(finalNumerator),
    ...say('2. COUNT WHERE THE EVENT HAPPENS', LATE),
    ...fbox([
      ['2. count', LATE],
      'runs where the event happens'
    ], LATE)
  );

  await until(S(39) + 4.4);

  await play(
    ...add(
      finalFractionBar,
      finalDenominator,
      finalResult
    ),
    ...say('3. DIVIDE BY THE NUMBER OF RUNS', C.green),
    ...fbox([
      ['Monte Carlo estimate', C.violet],
      'event count ÷ all runs',
      ['12 ÷ 100 = 0.12', C.green]
    ], C.green)
  );

  await until(S(39) + 6.1);

  await play(
    new M.Indicate(finalResult, {
      color: C.green,
      runTime: 0.8
    }),
    ...say('SIMULATE → COUNT → DIVIDE', C.green)
  );

  await until(E(39));
}
