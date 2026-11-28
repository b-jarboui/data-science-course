// lesson 11.3.3
// Scaled forecast error (MASE).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Fixed shared chapter data.
  const D = [40, 41, 44, 42, 44, 45, 48, 46, 49, 48, 50, 52];

  const NORTH = {
    misses: [2, 1, 1, 2],
    total: 6,
    mean: 1.5,
    trainingMisses: [1, 3, 2, 2, 1, 3, 2],
    trainingTotal: 14,
    benchmark: 2,
    mase: 0.75
  };

  const EAST = {
    misses: [30, 20, 40, 30],
    total: 120,
    mean: 30,
    benchmark: 20,
    mase: 1.5
  };

  const TARGETS = [9, 10, 11, 12];

  const NC = C.cyan;
  const EC = C.gold || '#F5C451';
  const BC = C.violet;

  // Responsive layout.
  // Phone: 8 × 14.22; content between y=-5.5 and y=4.3.
  // Laptop: 14.22 × 8; content between y=-3.0 and y=2.3.

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.75, 0] : [0, 1.97, 0];
  const BOXP = P ? [0, -5.0, 0] : [4.25, -0.30, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fadeIn = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  function txt(
    s, size, color, p,
    mono = false,
    maxw = FW - 1.1
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    width, height, p,
    color,
    opacity = 0,
    strokeWidth = 2
  ) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(
    width, height, p,
    color,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.15,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function arrow(a, b, color = C.amber) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const d = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / d;
    const uy = dy / d;

    const h = 0.16;
    const wing = 0.085;

    return new M.VGroup(
      line(a, b, color, 2.5),
      line(
        b,
        [
          b[0] - h * ux + wing * uy,
          b[1] - h * uy - wing * ux,
          0
        ],
        color,
        2.5
      ),
      line(
        b,
        [
          b[0] - h * ux - wing * uy,
          b[1] - h * uy + wing * ux,
          0
        ],
        color,
        2.5
      )
    );
  }

  function glowDot(p, color, radius = 0.09) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.17);

    const dot = new M.Dot({
      point: p,
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  // Formula box: same structure as the approved reference.

  let boxNow = null;

  function fbox(lines, color = C.cyan, position = BOXP) {
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

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.97);
    r.moveTo(position);

    const left = position[0] - wd / 2 + 0.35;

    const top =
      position[1] + ht / 2 - 0.2 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.35;

    if (wd > maxw) {
      g.scale(maxw / wd);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];

    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // 0–1: Two stores of very different sizes.
  // ------------------------------------------------------------

  function waterCase(cx, cy, color, scale = 1) {
    const parts = [];

    for (let k = 0; k < 3; k++) {
      const bx = cx + (k - 1) * 0.34 * scale;

      const body = rounded(
        0.25 * scale,
        0.65 * scale,
        [bx, cy + 0.10 * scale, 0],
        color,
        0.8
      );

      body.setFill(color, 0.35);

      const neck = rect(
        0.12 * scale,
        0.16 * scale,
        [bx, cy + 0.50 * scale, 0],
        color,
        0.60,
        1
      );

      const cap = rect(
        0.17 * scale,
        0.08 * scale,
        [bx, cy + 0.62 * scale, 0],
        C.ink,
        0.85,
        1
      );

      const label = rect(
        0.24 * scale,
        0.15 * scale,
        [bx, cy + 0.07 * scale, 0],
        color,
        0.85,
        1
      );

      parts.push(body, neck, cap, label);
    }

    const crate = rounded(
      1.18 * scale,
      0.45 * scale,
      [cx, cy - 0.25 * scale, 0],
      color
    );

    crate.setFill(color, 0.20);

    parts.push(crate);

    return new M.VGroup(...parts);
  }

  const IX = P ? 1.85 : 3.0;
  const IY = P ? -0.45 : -0.30;

  const introNorth = waterCase(
    -IX, IY,
    NC,
    P ? 0.95 : 1.05
  );

  const introEast = [];

  const eastScale = P ? 0.69 : 0.78;

  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < 3; k++) {
      introEast.push(
        waterCase(
          IX + (k - 1) * eastScale * 1.25,
          IY + (r - 0.5) * eastScale * 0.98,
          EC,
          eastScale
        )
      );
    }
  }

  const northTitle = pill(
    'NORTH',
    NC,
    22
  );

  northTitle.moveTo([
    -IX,
    IY + 1.35,
    0
  ]);

  const eastTitle = pill(
    'EAST',
    EC,
    22
  );

  eastTitle.moveTo([
    IX,
    IY + 1.35,
    0
  ]);

  const northSize = txt(
    'Small store',
    20,
    NC,
    [-IX, IY - 1.12, 0]
  );

  const eastSize = txt(
    'Big store',
    20,
    EC,
    [IX, IY - 1.12, 0]
  );

  const northVolume = txt(
    'About 40–50 cases',
    P ? 16 : 19,
    C.muted,
    [-IX, IY - 1.55, 0],
    true,
    P ? 3.35 : 4.6
  );

  const eastVolume = txt(
    'About 300–400 cases',
    P ? 16 : 19,
    C.muted,
    [IX, IY - 1.55, 0],
    true,
    P ? 3.35 : 4.6
  );

  await until(S(0));
  await play(
    new M.FadeIn(introNorth),
    new M.LaggedStart(
      introEast.map(o => new M.FadeIn(o)),
      { lagRatio: 0.09, runTime: 1.35 }
    ),
    ...fadeIn([
      northTitle,
      eastTitle,
      northSize,
      eastSize,
      northVolume,
      eastVolume
    ]),
    ...say('TWO STORES, VERY DIFFERENT SIZES')
  );

  await until(S(1));
  await play(
    new M.Indicate(northTitle, { color: NC }),
    new M.Indicate(eastTitle, { color: EC }),
    ...say('HOW CAN WE COMPARE THEM FAIRLY?', C.amber)
  );

  // ------------------------------------------------------------
  // 2–10: Compare the raw misses in cases.
  // Both stores use the SAME physical scale for these bars.
  // ------------------------------------------------------------

  const RCX = P ? 0 : -2.65;

  const RAW_SP = P ? 0.95 : 1.00;
  const RAW_BW = P ? 0.58 : 0.61;

  const RAW_UNIT = P ? 0.082 : 0.065;

  const RAW_NX = P ? -1.95 : RCX - 2.05;
  const RAW_EX = P ? 1.95 : RCX + 2.05;

  const RAW_BASE = P ? -2.30 : -1.80;

  const RAW_TOP = RAW_BASE + 40 * RAW_UNIT;

  const rawx = (cx, k) =>
    cx + (k - 1.5) * RAW_SP;

  const rawParts = [];

  function rawBar(cx, k, n, color) {
    const h = n * RAW_UNIT;
    const xx = rawx(cx, k);

    return rect(
      RAW_BW,
      h,
      [xx, RAW_BASE + h / 2, 0],
      color,
      0.80,
      1.5
    );
  }

  function rawNumbers(cx, values, color) {
    return values.map((n, k) =>
      txt(
        n,
        P ? 19 : 20,
        color,
        [
          rawx(cx, k),
          RAW_BASE + n * RAW_UNIT + 0.25,
          0
        ],
        true
      )
    );
  }

  function rawWeeks(cx) {
    return TARGETS.map((w, k) =>
      txt(
        w,
        P ? 15 : 16,
        C.muted,
        [
          rawx(cx, k),
          RAW_BASE - 0.27,
          0
        ],
        true
      )
    );
  }

  const rawLeft =
    rawx(RAW_NX, 0) - RAW_BW / 2 - 0.12;

  const rawRight =
    rawx(RAW_EX, 3) + RAW_BW / 2 + 0.12;

  // Keep phone axis labels within the safe frame.
  const rawAxisX = P ? -3.64 : rawLeft - 0.27;

  const rawFloor = line(
    [rawLeft, RAW_BASE, 0],
    [rawRight, RAW_BASE, 0],
    C.muted,
    2
  );

  rawParts.push(rawFloor);

  for (const v of [10, 20, 30, 40]) {
    const yy = RAW_BASE + v * RAW_UNIT;

    rawParts.push(
      line(
        [rawLeft, yy, 0],
        [rawRight, yy, 0],
        C.muted,
        0.7
      )
    );

    rawParts.push(
      txt(
        v,
        P ? 15 : 15,
        C.muted,
        [rawAxisX, yy, 0],
        true,
        P ? 0.40 : 0.52
      )
    );
  }

  const rawTitle = txt(
    'MISSES IN CASES',
    P ? 23 : 21,
    C.ink,
    [RCX, P ? 2.60 : 1.48, 0],
    true
  );

  rawParts.push(rawTitle);

  const rawWeekLabel = txt(
    'Target weeks',
    16,
    C.muted,
    [RCX, RAW_BASE - 0.64, 0]
  );

  rawParts.push(rawWeekLabel);

  const northRawTitle = txt(
    'NORTH',
    P ? 20 : 21,
    NC,
    [RAW_NX, RAW_TOP + 0.48, 0],
    true
  );

  const eastRawTitle = txt(
    'EAST',
    P ? 20 : 21,
    EC,
    [RAW_EX, RAW_TOP + 0.48, 0],
    true
  );

  const northBars = NORTH.misses.map((n, k) =>
    rawBar(RAW_NX, k, n, NC)
  );

  const eastBars = EAST.misses.map((n, k) =>
    rawBar(RAW_EX, k, n, EC)
  );

  const northNumbers = rawNumbers(
    RAW_NX,
    NORTH.misses,
    NC
  );

  const eastNumbers = rawNumbers(
    RAW_EX,
    EAST.misses,
    EC
  );

  const northWeeks = rawWeeks(RAW_NX);
  const eastWeeks = rawWeeks(RAW_EX);

  await until(S(2));
  await play(
    ...fadeOut([
      introNorth,
      ...introEast,
      northTitle,
      eastTitle,
      northSize,
      eastSize,
      northVolume,
      eastVolume
    ]),
    ...fadeIn(rawParts),
    new M.FadeIn(northRawTitle),
    ...fadeIn(northWeeks),
    new M.LaggedStart(
      northBars.map(b => new M.FadeIn(b)),
      { lagRatio: 0.14, runTime: 1.2 }
    ),
    ...say('NORTH: FOUR LATER FORECASTS', NC)
  );

  await until(S(3));
  await play(
    ...fadeIn(northNumbers),
    ...say('NORTH MISSES: 2, 1, 1, 2', NC)
  );

  const northMeanTag = pill(
    'AVERAGE: 1.5',
    NC,
    P ? 17 : 18
  );

  northMeanTag.moveTo([
    RAW_NX,
    P ? -3.23 : -2.66,
    0
  ]);

  await until(S(4));
  await play(
    new M.FadeIn(northMeanTag),
    ...fbox([
      ['North', NC],
      '2 + 1 + 1 + 2 = 6',
      ['6 ÷ 4 = 1.5 cases', NC]
    ], NC),
    ...say('NORTH: 1.5 CASES PER FORECAST', NC)
  );

  await until(S(5));
  await play(
    new M.FadeIn(eastRawTitle),
    ...fadeIn(eastWeeks),
    new M.LaggedStart(
      eastBars.map(b => new M.FadeIn(b)),
      { lagRatio: 0.12, runTime: 1.0 }
    ),
    ...say('EAST: FOUR LATER FORECASTS', EC)
  );

  await until(S(6));
  await play(
    ...fadeIn(eastNumbers),
    ...say('EAST MISSES: 30, 20, 40, 30', EC)
  );

  const eastMeanTag = pill(
    'AVERAGE: 30',
    EC,
    P ? 17 : 18
  );

  eastMeanTag.moveTo([
    RAW_EX,
    P ? -3.23 : -2.66,
    0
  ]);

  await until(S(7));
  await play(
    new M.FadeIn(eastMeanTag),
    ...fbox([
      ['East', EC],
      '30 + 20 + 40 + 30',
      '= 120',
      ['120 ÷ 4 = 30 cases', EC]
    ], EC),
    ...say('EAST: 30 CASES PER FORECAST', EC)
  );

  // Replace the individual misses with their average bars.

  const MCX = P ? 0 : -2.55;
  const MSP = P ? 3.1 : 3.5;
  const MBW = P ? 1.45 : 1.65;
  const MBASE = P ? -2.20 : -1.85;
  const MUNIT = P ? 0.125 : 0.092;

  const mxN = MCX - MSP / 2;
  const mxE = MCX + MSP / 2;

  function meanBar(xx, v, color) {
    const h = v * MUNIT;

    return rect(
      MBW,
      h,
      [xx, MBASE + h / 2, 0],
      color,
      0.68,
      2
    );
  }

  const meanNorth = meanBar(
    mxN,
    NORTH.mean,
    NC
  );

  const meanEast = meanBar(
    mxE,
    EAST.mean,
    EC
  );

  const meanTitle = txt(
    'AVERAGE MISS (CASES)',
    P ? 23 : 21,
    C.ink,
    [MCX, P ? 2.65 : 1.52, 0],
    true
  );

  const meanFloor = line(
    [MCX - MSP / 2 - MBW / 2 - 0.3, MBASE, 0],
    [MCX + MSP / 2 + MBW / 2 + 0.3, MBASE, 0],
    C.muted,
    2
  );

  const meanNorthNumber = txt(
    '1.5',
    28,
    NC,
    [
      mxN,
      MBASE + NORTH.mean * MUNIT + 0.29,
      0
    ],
    true
  );

  const meanEastNumber = txt(
    '30',
    28,
    EC,
    [
      mxE,
      MBASE + EAST.mean * MUNIT + 0.29,
      0
    ],
    true
  );

  const meanNorthLabel = txt(
    'NORTH',
    19,
    NC,
    [mxN, MBASE - 0.38, 0],
    true
  );

  const meanEastLabel = txt(
    'EAST',
    19,
    EC,
    [mxE, MBASE - 0.38, 0],
    true
  );

  const meanParts = [
    meanTitle,
    meanFloor,
    meanNorth,
    meanEast,
    meanNorthNumber,
    meanEastNumber,
    meanNorthLabel,
    meanEastLabel
  ];

  const twentyTag = pill(
    '20× AS BIG',
    C.amber,
    19
  );

  twentyTag.moveTo([
    MCX,
    P ? -3.24 : -2.63,
    0
  ]);

  await until(S(8));
  await play(
    ...fadeOut([
      ...rawParts,
      ...northBars,
      ...eastBars,
      ...northNumbers,
      ...eastNumbers,
      ...northWeeks,
      ...eastWeeks,
      northRawTitle,
      eastRawTitle,
      northMeanTag,
      eastMeanTag
    ]),
    ...fadeIn(meanParts),
    new M.FadeIn(twentyTag),
    ...fbox([
      ['raw average misses', C.ink],
      ['East  = 30', EC],
      ['North = 1.5', NC],
      ['30 ÷ 1.5 = 20', C.amber]
    ], C.amber),
    ...say('EAST’S RAW MISS IS 20 TIMES AS BIG', C.amber)
  );

  await until(S(9));
  await play(
    new M.Indicate(meanEast, { color: EC }),
    new M.Indicate(meanEastNumber, { color: EC }),
    ...say('30 CASES TELLS US THE SIZE OF THE MISS', EC)
  );

  await until(S(10));
  await play(
    new M.FadeOut(twentyTag),
    ...fbox([
      ['East misses 30 cases', EC],
      'But how large is that',
      'for this big store?',
      ['We need a yardstick.', C.amber]
    ], C.amber),
    ...say('IS 30 A LOT FOR EAST?', C.amber)
  );

  // ------------------------------------------------------------
  // 11: Introduce a separate historical yardstick for each store.
  // The yardsticks are calculated from earlier weeks.
  // ------------------------------------------------------------

  function ruler(cx, cy, width, color, title) {
    const parts = [];

    const r = rounded(
      width,
      0.68,
      [cx, cy, 0],
      color
    );

    r.setFill(color, 0.16);

    parts.push(r);

    const inset = 0.22;
    const len = width - 2 * inset;

    for (let k = 0; k <= 10; k++) {
      const xx = cx - width / 2 + inset + k * len / 10;

      parts.push(
        line(
          [xx, cy - 0.24, 0],
          [xx, cy + (k % 5 === 0 ? 0.17 : 0.03), 0],
          color,
          k % 5 === 0 ? 2 : 1
        )
      );
    }

    const label = txt(
      title,
      P ? 18 : 20,
      color,
      [cx, cy + 0.65, 0],
      true,
      width + 0.25
    );

    parts.push(label);

    const question = txt(
      '? cases',
      23,
      color,
      [cx, cy - 0.70, 0],
      true
    );

    parts.push(question);

    return new M.VGroup(...parts);
  }

  const rulerN = ruler(
    P ? 0 : -3.1,
    P ? 1.0 : 0.10,
    P ? 4.7 : 4.2,
    NC,
    'NORTH’S OWN YARDSTICK'
  );

  const rulerE = ruler(
    P ? 0 : 3.1,
    P ? -1.65 : 0.10,
    P ? 4.7 : 4.2,
    EC,
    'EAST’S OWN YARDSTICK'
  );

  const rulerNote = txt(
    'Based on earlier week-to-week changes',
    P ? 20 : 21,
    C.muted,
    [0, P ? -3.40 : -1.60, 0]
  );

  await until(S(11));
  await play(
    ...fadeOut(meanParts),
    ...clearBox(),
    new M.FadeIn(rulerN),
    new M.FadeIn(rulerE),
    new M.FadeIn(rulerNote),
    ...say('GIVE EACH STORE ITS OWN YARDSTICK', C.green)
  );

  // ------------------------------------------------------------
  // 12–15: North's earlier weeks.
  // Naive forecast = copy the previous week's demand.
  // ------------------------------------------------------------

  const HSP = P ? (FW - 2.05) / 7 : 0.99;
  const HBASE = P ? -1.45 : -1.35;
  const HUNIT = P ? 0.37 : 0.25;

  const hx = w => CX + (w - 4.5) * HSP;
  const hy = v => HBASE + (v - 40) * HUNIT;
  const hp = (w, v) => [hx(w), hy(v), 0];

  const HLEFT = hx(1) - HSP / 2;
  const HRIGHT = hx(8) + HSP / 2;

  const HBOTTOM = HBASE - 0.32;
  const HTOP = hy(48) + 0.34;

  const historyParts = [];
  const historyDots = [];

  const historyTitle = txt(
    'NORTH: EARLIER WEEKS 1–8',
    P ? 23 : 20,
    NC,
    [CX, P ? 2.57 : 1.49, 0],
    true
  );

  historyParts.push(historyTitle);

  const historyFloor = line(
    [HLEFT, HBOTTOM, 0],
    [HRIGHT, HBOTTOM, 0],
    C.muted,
    2
  );

  historyParts.push(historyFloor);

  for (let w = 1; w <= 8; w++) {
    const guide = line(
      [hx(w), HBOTTOM, 0],
      [hx(w), HTOP, 0],
      C.muted,
      0.7
    );

    const label = txt(
      w,
      P ? 17 : 17,
      C.muted,
      [hx(w), HBOTTOM - 0.24, 0],
      true
    );

    historyParts.push(guide, label);
  }

  for (const v of [40, 42, 44, 46, 48]) {
    const guide = line(
      [HLEFT, hy(v), 0],
      [HRIGHT, hy(v), 0],
      C.muted,
      0.7
    );

    const label = txt(
      v,
      P ? 15 : 16,
      C.muted,
      [
        HLEFT - (P ? 0.25 : 0.30),
        hy(v),
        0
      ],
      true
    );

    historyParts.push(guide, label);
  }

  const historyUnit = txt(
    'Week',
    16,
    C.muted,
    [CX, HBOTTOM - 0.59, 0]
  );

  historyParts.push(historyUnit);

  function historyActual(w) {
    const v = D[w - 1];
    const p = hp(w, v);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.16 : 0.17,
      color: NC
    });

    halo.setFill(NC, 0.18);

    const d = new M.Dot({
      point: p,
      radius: P ? 0.078 : 0.08,
      color: NC
    });

    const lab = txt(
      v,
      P ? 16 : 17,
      NC,
      [p[0], p[1] + 0.24, 0],
      true,
      HSP * 0.82
    );

    return new M.VGroup(halo, d, lab);
  }

  for (let w = 1; w <= 8; w++) {
    historyDots.push(historyActual(w));
  }

  const earlierTag = pill(
    'TRAINING WEEKS',
    NC,
    P ? 17 : 16
  );

  earlierTag.moveTo([
    CX,
    P ? -2.95 : -2.40,
    0
  ]);

  await until(S(12));
  await play(
    ...fadeOut([
      rulerN,
      rulerE,
      rulerNote
    ]),
    ...fadeIn(historyParts),
    new M.LaggedStart(
      historyDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.10, runTime: 1.45 }
    ),
    new M.FadeIn(earlierTag),
    ...say('USE NORTH’S EARLIER RECORD', NC)
  );

  await until(S(13));
  await play(
    new M.Indicate(historyDots[0], { color: NC }),
    ...say('WEEK 1: 40 CASES', NC)
  );

  function trainingForecast(w) {
    const previous = D[w - 2];

    const p = hp(w, previous);

    const ring = new M.Circle({
      radius: P ? 0.095 : 0.09,
      color: C.amber,
      strokeWidth: 3
    });

    ring.setFill(C.amber, 0);
    ring.moveTo(p);

    const guide = dashed(
      [
        hx(w - 1) + 0.11,
        hy(previous),
        0
      ],
      [
        hx(w) - 0.10,
        hy(previous),
        0
      ],
      C.amber
    );

    return new M.VGroup(guide, ring);
  }

  function trainingGap(w) {
    const predicted = D[w - 2];
    const observed = D[w - 1];

    return line(
      hp(w, predicted),
      hp(w, observed),
      BC,
      3.5
    );
  }

  function trainingMissNumber(w) {
    const n = Math.abs(D[w - 1] - D[w - 2]);

    const yy = P
      ? HBOTTOM - 1.0
      : HBOTTOM - 0.91;

    const r = rect(
      HSP * 0.70,
      0.33,
      [hx(w), yy, 0],
      BC,
      0.18,
      1.5
    );

    const label = txt(
      n,
      P ? 19 : 18,
      BC,
      [hx(w), yy, 0],
      true
    );

    return new M.VGroup(r, label);
  }

  const trainForecasts = [];
  const trainGaps = [];
  const trainNumbers = [];

  trainForecasts[0] = trainingForecast(2);

  await until(S(14));
  await play(
    new M.FadeIn(trainForecasts[0]),
    ...fbox([
      ['naive rule', C.amber],
      'week 1 = 40',
      ['week 2 guess = 40', C.amber]
    ], C.amber),
    ...say('COPY 40 INTO WEEK 2', C.amber)
  );

  trainGaps[0] = trainingGap(2);
  trainNumbers[0] = trainingMissNumber(2);

  await until(S(15));
  await play(
    new M.FadeOut(earlierTag),
    new M.Create(trainGaps[0]),
    new M.FadeIn(trainNumbers[0]),
    ...fbox([
      'actual   = 41',
      'forecast = 40',
      ['miss = 1 case', BC]
    ], BC),
    ...say('41 − 40: A GAP OF 1', BC)
  );

  // ------------------------------------------------------------
  // 16–21: The remaining six earlier naive misses.
  // Keep these beats very short to match the rapid narration.
  // ------------------------------------------------------------

  function nextTrainingPair(w) {
    const k = w - 2;

    trainForecasts[k] = trainingForecast(w);
    trainGaps[k] = trainingGap(w);
    trainNumbers[k] = trainingMissNumber(w);

    return [
      new M.FadeIn(
        trainForecasts[k],
        { runTime: 0.22 }
      ),
      new M.Create(
        trainGaps[k],
        { runTime: 0.22 }
      ),
      new M.FadeIn(
        trainNumbers[k],
        { runTime: 0.22 }
      )
    ];
  }

  await until(S(16));
  await play(
    ...nextTrainingPair(3),
    ...fbox([
      ['earlier naive misses', BC],
      'compare neighboring',
      'weeks, one at a time'
    ], BC),
    ...say('ONE GAP FOR EACH PAIR OF WEEKS', BC)
  );

  await until(S(17));
  await play(
    ...nextTrainingPair(4)
  );

  await until(S(18));
  await play(
    ...nextTrainingPair(5)
  );

  await until(S(19));
  await play(
    ...nextTrainingPair(6)
  );

  await until(S(20));
  await play(
    ...nextTrainingPair(7)
  );

  await until(S(21));
  await play(
    ...nextTrainingPair(8)
  );

  // ------------------------------------------------------------
  // 22–24: Convert the seven earlier misses into blocks,
  // then share fourteen blocks equally across seven pairs.
  // ------------------------------------------------------------

  const SCX = P ? 0 : -2.6;
  const SSP = P ? 0.91 : 1.04;
  const SBW = P ? 0.63 : 0.72;

  const SBASE = P ? -2.0 : -1.65;
  const SPITCH = P ? 0.74 : 0.57;

  const sx = k =>
    SCX + (k - 3) * SSP;

  const slot = (k, j) => [
    sx(k),
    SBASE + (j + 0.5) * SPITCH,
    0
  ];

  function missBlock(p, color = BC) {
    return rect(
      SBW,
      SPITCH * 0.83,
      p,
      color,
      0.83,
      1.5
    );
  }

  const stacks = NORTH.trainingMisses.map((n, k) =>
    Array.from(
      { length: n },
      (_, j) => missBlock(slot(k, j))
    )
  );

  const scoreFloor = line(
    [sx(0) - SSP / 2, SBASE, 0],
    [sx(6) + SSP / 2, SBASE, 0],
    C.muted,
    2
  );

  const scoreTitle = txt(
    'EARLIER NAIVE MISSES',
    P ? 23 : 21,
    BC,
    [SCX, P ? 1.71 : 1.14, 0],
    true
  );

  const pairLabels = Array.from(
    { length: 7 },
    (_, k) =>
      txt(
        `${k + 1}→${k + 2}`,
        P ? 16 : 17,
        C.muted,
        [sx(k), SBASE - 0.31, 0],
        true,
        SSP - 0.12
      )
  );

  function stackLabels(values, color) {
    return values.map((v, k) =>
      txt(
        v,
        23,
        color,
        [
          sx(k),
          SBASE + v * SPITCH + 0.28,
          0
        ],
        true
      )
    );
  }

  let scoreLabels = stackLabels(
    NORTH.trainingMisses,
    BC
  );

  const scoreKey = txt(
    '1 block = 1 case missed',
    P ? 17 : 16,
    C.muted,
    [SCX, SBASE - 0.77, 0]
  );

  await until(S(22));
  await play(
    ...fadeOut([
      ...historyParts,
      ...historyDots,
      ...trainForecasts,
      ...trainGaps,
      ...trainNumbers
    ]),
    new M.FadeIn(scoreTitle),
    new M.Create(scoreFloor),
    new M.FadeIn(scoreKey),
    ...fadeIn(pairLabels),
    ...fadeIn(scoreLabels),
    new M.LaggedStart(
      stacks.flat().map(b => new M.FadeIn(b)),
      { lagRatio: 0.035, runTime: 1.25 }
    ),
    ...fbox([
      '1 + 3 + 2 + 2',
      '+ 1 + 3 + 2',
      ['total = 14 cases', BC],
      'pairs = 7'
    ], BC),
    ...say('14 CASES ACROSS 7 PAIRS', BC)
  );

  const moves = [];

  function transferBlock(from, to) {
    const b = stacks[from].pop();

    const destination = slot(
      to,
      stacks[to].length
    );

    stacks[to].push(b);

    moves.push(
      new M.Transform(
        b,
        missBlock(destination, BC),
        { pathArc: -0.85 }
      )
    );
  }

  // [1,3,2,2,1,3,2] becomes [2,2,2,2,2,2,2].
  transferBlock(1, 0);
  transferBlock(5, 4);

  const balancedLabels = stackLabels(
    [2, 2, 2, 2, 2, 2, 2],
    C.green
  );

  const level = dashed(
    [
      sx(0) - SSP / 2,
      SBASE + 2 * SPITCH,
      0
    ],
    [
      sx(6) + SSP / 2,
      SBASE + 2 * SPITCH,
      0
    ],
    C.green
  );

  await until(S(23));
  await play(
    ...fadeOut(scoreLabels),
    new M.LaggedStart(
      moves,
      { lagRatio: 0.30, runTime: 1.4 }
    ),
    ...fbox([
      'total miss = 14',
      'pairs      = 7',
      ['14 ÷ 7 = 2 cases', C.green]
    ], C.green),
    ...say('NORTH’S YARDSTICK = 2 CASES', C.green)
  );

  await play(
    ...fadeIn(balancedLabels),
    new M.Create(level)
  );

  scoreLabels = balancedLabels;

  const benchmarkTitle = txt(
    'NORTH’S NAIVE BENCHMARK',
    P ? 23 : 21,
    C.green,
    [SCX, P ? 1.71 : 1.14, 0],
    true
  );

  await until(S(24));
  await play(
    new M.Transform(scoreTitle, benchmarkTitle),
    ...fbox([
      ['benchmark', C.green],
      'a comparison standard',
      'earlier naive average',
      ['North = 2 cases', NC]
    ], C.green),
    ...say('BENCHMARK = A NUMBER TO COMPARE AGAINST', C.green)
  );

  // ------------------------------------------------------------
  // 25–28: Measure each store's later miss in units of its
  // OWN historical benchmark.
  //
  // Both benchmark bars are drawn as one unit.
  // North: 1.5 / 2 = 0.75 benchmark units.
  // East: 30 / 20 = 1.5 benchmark units.
  // ------------------------------------------------------------

  const YCX = P ? 0.10 : -2.55;

  const YLEFT = YCX - (P ? 2.68 : 2.88);
  const YUNIT = P ? 3.12 : 3.23;
  const YBH = P ? 0.46 : 0.43;

  const NY = P ? 1.62 : 0.82;
  const EY = P ? -1.35 : -1.04;

  const YGAP = P ? 0.89 : 0.71;

  function yardstickBar(ratio, yy, color, opacity) {
    const width = ratio * YUNIT;

    return rect(
      width,
      YBH,
      [YLEFT + width / 2, yy, 0],
      color,
      opacity,
      2
    );
  }

  function yardstickFrame(yy, storeColor, benchmark) {
    const parts = [];

    const outline = yardstickBar(
      1,
      yy,
      storeColor,
      0.10
    );

    parts.push(outline);

    for (let k = 1; k <= 0; k++) {
      const xx = YLEFT + YUNIT * k / 4;

      parts.push(
        line(
          [xx, yy - YBH / 2, 0],
          [xx, yy + YBH / 2, 0],
          storeColor,
          1
        )
      );
    }

    const label = txt(
      `Earlier benchmark: ${benchmark} cases`,
      P ? 18 : 18,
      storeColor,
      [
        YLEFT + YUNIT * 0.75,
        yy + 0.40,
        0
      ],
      true,
      P ? 5.9 : 5.7
    );

    parts.push(label);

    const one = txt(
      '1 yardstick',
      P ? 15 : 16,
      C.muted,
      [
        YLEFT + YUNIT / 2,
        yy,
        0
      ],
      true,
      YUNIT - 0.20
    );

    parts.push(one);

    return new M.VGroup(...parts);
  }

  function laterBar(yy, mean, ratio, color) {
    const r = yardstickBar(
      ratio,
      yy,
      color,
      0.78
    );

    const label = txt(
      `Later miss: ${mean} cases`,
      P ? 17 : 17,
      color,
      [
        YLEFT + YUNIT * 0.75,
        yy - 0.42,
        0
      ],
      true,
      P ? 5.9 : 5.7
    );

    return new M.VGroup(r, label);
  }

  function ratioMarker(yy, ratio, value, color) {
    const xx = YLEFT + ratio * YUNIT;

    const tick = line(
      [xx, yy - YBH / 2 - 0.10, 0],
      [xx, yy + YBH / 2 + 0.10, 0],
      color,
      3
    );

    const label = txt(
      value,
      P ? 21 : 20,
      color,
      [xx + 0.42, yy, 0],
      true
    );

    return new M.VGroup(tick, label);
  }

  const yardstickTitle = txt(
    'MEASURE AGAINST YOUR OWN BENCHMARK',
    P ? 20 : 19,
    C.ink,
    [YCX, P ? 2.87 : 1.55, 0],
    true,
    P ? FW - 1 : 7.0
  );

  const northYardstick = yardstickFrame(
    NY,
    NC,
    2
  );

  const northLater = laterBar(
    NY - YGAP,
    1.5,
    0.75,
    NC
  );

  const northRatio = ratioMarker(
    NY - YGAP,
    0.75,
    '0.75',
    C.green
  );

  const eastYardstick = yardstickFrame(
    EY,
    EC,
    20
  );

  const eastLater = laterBar(
    EY - YGAP,
    30,
    1.5,
    EC
  );

  const eastRatio = ratioMarker(
    EY - YGAP,
    1.5,
    '1.5',
    EC
  );

  const northModelTag = pill(
    'NORTH: HOLT’S METHOD',
    NC,
    P ? 16 : 16
  );

  northModelTag.moveTo([
    YCX,
    P ? -0.35 : -0.34,
    0
  ]);

  // On laptop place the model tag temporarily in the right panel,
  // above the formula box.

  if (!P) {
    northModelTag.moveTo([4.25, 1.13, 0]);
  }

  await until(S(25));
  await play(
    ...fadeOut([
      scoreTitle,
      scoreFloor,
      scoreKey,
      level,
      ...pairLabels,
      ...scoreLabels,
      ...stacks.flat()
    ]),
    new M.FadeIn(yardstickTitle),
    new M.FadeIn(northYardstick),
    new M.FadeIn(northModelTag),
    ...fbox([
      ['later forecasts', NC],
      'North: Holt’s method',
      'weeks 9–12',
      ['average miss = 1.5', NC]
    ], NC),
    ...say('NORTH NOW USES HOLT’S METHOD', NC)
  );

  await until(S(26));
  await play(
    new M.FadeIn(northLater),
    new M.FadeIn(northRatio),
    ...fbox([
      ['North', NC],
      'later miss = 1.5',
      'benchmark  = 2',
      ['1.5 ÷ 2 = 0.75', C.green]
    ], NC),
    ...say('NORTH: THREE QUARTERS OF ITS YARDSTICK', NC)
  );

  await until(S(27));
  await play(
    new M.FadeOut(northModelTag),
    new M.FadeIn(eastYardstick),
    ...fbox([
      ['East', EC],
      'earlier weeks',
      'same naive rule',
      ['benchmark = 20 cases', EC]
    ], EC),
    ...say('EAST’S OWN BENCHMARK = 20 CASES', EC)
  );

  await until(S(28));
  await play(
    new M.FadeIn(eastLater),
    new M.FadeIn(eastRatio),
    ...fbox([
      ['East', EC],
      'later miss = 30',
      'benchmark  = 20',
      ['30 ÷ 20 = 1.5', EC]
    ], EC),
    ...say('EAST: ONE AND A HALF YARDSTICKS', EC)
  );

  // ------------------------------------------------------------
  // 29–31: Both scaled errors on a common number line.
  // The reference value of 1 means equal to the benchmark.
  // ------------------------------------------------------------

  const LCX = P ? 0 : -2.55;
  const LLEN = P ? 6.0 : 7.0;
  const LY = P ? -0.25 : -0.40;

  const lx = v =>
    LCX - LLEN / 2 + v * LLEN / 2;

  const scaleParts = [];

  const scaleTitle = txt(
    'MISS IN BENCHMARK UNITS',
    P ? 23 : 21,
    C.ink,
    [LCX, P ? 2.60 : 1.36, 0],
    true
  );

  scaleParts.push(scaleTitle);

  const scaleLine = line(
    [lx(0), LY, 0],
    [lx(2), LY, 0],
    C.muted,
    3
  );

  scaleParts.push(scaleLine);

  // Neutral reference regions, not pass/fail labels.

  const belowRegion = rect(
    LLEN / 2,
    0.29,
    [(lx(0) + lx(1)) / 2, LY, 0],
    C.green,
    0.12,
    1
  );

  const aboveRegion = rect(
    LLEN / 2,
    0.29,
    [(lx(1) + lx(2)) / 2, LY, 0],
    C.amber,
    0.10,
    1
  );

  scaleParts.push(belowRegion, aboveRegion);

  for (const v of [0, 0.5, 1, 1.5, 2]) {
    const tick = line(
      [lx(v), LY - 0.10, 0],
      [lx(v), LY + 0.10, 0],
      v === 1 ? C.ink : C.muted,
      v === 1 ? 3 : 1.8
    );

    const label = txt(
      v,
      v === 1 ? 23 : 18,
      v === 1 ? C.ink : C.muted,
      [lx(v), LY - 0.34, 0],
      true
    );

    scaleParts.push(tick, label);
  }

  const reference = dashed(
    [lx(1), LY - 0.07, 0],
    [lx(1), LY + 1.12, 0],
    C.ink
  );

  const referenceTag = pill(
    '1 = BENCHMARK',
    C.ink,
    P ? 17 : 17
  );

  referenceTag.moveTo([
    lx(1),
    LY + (P ? 1.43 : 1.32),
    0
  ]);

  scaleParts.push(reference, referenceTag);

  const northScaled = glowDot(
    [lx(0.75), LY, 0],
    NC,
    0.11
  );

  const eastScaled = glowDot(
    [lx(1.5), LY, 0],
    EC,
    0.11
  );

  const northScaledNumber = txt(
    '0.75',
    P ? 28 : 27,
    NC,
    [lx(0.75), LY + 0.49, 0],
    true
  );

  const eastScaledNumber = txt(
    '1.5',
    P ? 28 : 27,
    EC,
    [lx(1.5), LY + 0.49, 0],
    true
  );

  const northScaledLabel = txt(
    'NORTH',
    P ? 18 : 17,
    NC,
    [lx(0.75), LY + 0.88, 0],
    true
  );

  const eastScaledLabel = txt(
    'EAST',
    P ? 18 : 17,
    EC,
    [lx(1.5), LY + 0.88, 0],
    true
  );

  const scaleDots = [
    northScaled,
    eastScaled,
    northScaledNumber,
    eastScaledNumber,
    northScaledLabel,
    eastScaledLabel
  ];

  await until(S(29));
  await play(
    ...fadeOut([
      yardstickTitle,
      northYardstick,
      northLater,
      northRatio,
      eastYardstick,
      eastLater,
      eastRatio
    ]),
    ...clearBox(),
    ...fadeIn(scaleParts),
    ...fadeIn(scaleDots),
    ...say('COMPARE BOTH RESULTS ON ONE SCALE', C.green)
  );

  const belowLabel = txt(
    'Smaller than benchmark',
    P ? 16 : 17,
    C.green,
    [
      (lx(0) + lx(1)) / 2,
      LY - 0.86,
      0
    ],
    false,
    LLEN / 2 - 0.18
  );

  const aboveLabel = txt(
    'Larger than benchmark',
    P ? 16 : 17,
    C.amber,
    [
      (lx(1) + lx(2)) / 2,
      LY - 0.86,
      0
    ],
    false,
    LLEN / 2 - 0.18
  );

  const northOutline = new M.Circle({
    radius: 0.24,
    color: C.green,
    strokeWidth: 2.5
  });

  northOutline.setFill(C.green, 0);
  northOutline.moveTo([lx(0.75), LY, 0]);

  await until(S(30));
  await play(
    new M.Create(northOutline),
    new M.FadeIn(belowLabel),
    new M.Indicate(northScaledNumber, { color: NC }),
    ...fbox([
      ['North: 0.75', NC],
      'below 1',
      'later average miss',
      ['< earlier benchmark', C.green]
    ], C.green),
    ...say('NORTH IS BELOW ITS OLD BENCHMARK', NC)
  );

  const eastOutline = new M.Circle({
    radius: 0.24,
    color: C.amber,
    strokeWidth: 2.5
  });

  eastOutline.setFill(C.amber, 0);
  eastOutline.moveTo([lx(1.5), LY, 0]);

  await until(S(31));
  await play(
    new M.FadeOut(northOutline),
    new M.Create(eastOutline),
    new M.FadeIn(aboveLabel),
    new M.Indicate(eastScaledNumber, { color: EC }),
    ...fbox([
      ['East: 1.5', EC],
      'above 1',
      'later average miss',
      ['> earlier benchmark', C.amber]
    ], EC),
    ...say('EAST IS ABOVE ITS OLD BENCHMARK', EC)
  );

  // ------------------------------------------------------------
  // 32–35: Name the scaled error and give the formula.
  // ------------------------------------------------------------

  const scaledTitle = txt(
    'SCALED ERROR',
    P ? 25 : 22,
    C.green,
    [LCX, P ? 2.60 : 1.36, 0],
    true
  );

  const scaledUnitNote = txt(
    'Measured in yardsticks, not cases',
    P ? 22 : 18,
    C.muted,
    [LCX, P ? -2.01 : -1.97, 0]
  );

  await until(S(32));
  await play(
    new M.FadeOut(eastOutline),
    new M.Transform(scaleTitle, scaledTitle),
    new M.FadeIn(scaledUnitNote),
    ...fbox([
      ['scaled error', C.green],
      'North = 0.75 yardsticks',
      'East  = 1.5 yardsticks',
      'no case-count units'
    ], C.green),
    ...say('SCALED ERROR = MISS IN YARDSTICK UNITS', C.green)
  );

  const maseTitle = txt(
    'MEAN ABSOLUTE SCALED ERROR',
    P ? 23 : 20,
    C.green,
    [LCX, P ? 2.60 : 1.36, 0],
    true,
    P ? FW - 1.05 : 7.0
  );

  await until(S(33));
  await play(
    new M.Transform(scaleTitle, maseTitle),
    ...fbox([
      ['MASE', C.green],
      'Mean',
      'Absolute',
      'Scaled',
      'Error'
    ], C.green),
    ...say('MEAN ABSOLUTE SCALED ERROR = MASE', C.green)
  );

  await until(S(34));
  await play(
    ...fbox([
      ['MASE =', C.green],
      'later model average miss',
      '÷ earlier naive average',
      ['North: 1.5 ÷ 2 = 0.75', NC],
      ['East:  30 ÷ 20 = 1.5', EC]
    ], C.green),
    ...say('DIVIDE LATER MISS BY EARLIER NAIVE MISS', C.green)
  );

  const comparisonNote = txt(
    'Each store is measured against its own history',
    P ? 21 : 17,
    C.green,
    [LCX, P ? -2.75 : -2.53, 0],
    false,
    P ? FW - 1.05 : 7.0
  );

  await until(S(35));
  await play(
    new M.FadeIn(comparisonNote),
    new M.Indicate(northScaledNumber, { color: NC }),
    new M.Indicate(eastScaledNumber, { color: EC }),
    ...say('COMPARE STORES OF DIFFERENT SIZES', C.green)
  );

  // ------------------------------------------------------------
  // 36–37: Important trap.
  // MASE compares a later model with an EARLIER naive benchmark.
  // It is not automatically a head-to-head test on later weeks.
  // ------------------------------------------------------------

  const TCX = P ? 0 : -2.50;
  const TSP = P ? 1.78 : 1.94;

  const earlyX = TCX - TSP;
  const lateX = TCX + TSP;

  const CARDW = P ? 3.12 : 3.38;
  const CARDH = P ? 1.82 : 1.57;

  const CARDY = P ? 0.75 : -0.02;

  function comparisonCard(
    xx, yy,
    heading,
    subheading,
    value,
    color
  ) {
    const r = rounded(
      CARDW,
      CARDH,
      [xx, yy, 0],
      color
    );

    const h = txt(
      heading,
      P ? 18 : 17,
      C.ink,
      [
        xx,
        yy + CARDH * 0.31,
        0
      ],
      true,
      CARDW - 0.25
    );

    const sub = txt(
      subheading,
      P ? 16 : 16,
      C.muted,
      [
        xx,
        yy + CARDH * 0.06,
        0
      ],
      true,
      CARDW - 0.25
    );

    const n = txt(
      value,
      P ? 26 : 24,
      color,
      [
        xx,
        yy - CARDH * 0.23,
        0
      ],
      true,
      CARDW - 0.25
    );

    return new M.VGroup(r, h, sub, n);
  }

  const trapTitle = txt(
    'WHAT DOES A SCORE BELOW 1 MEAN?',
    P ? 20 : 19,
    C.amber,
    [TCX, P ? 2.70 : 1.45, 0],
    true,
    P ? FW - 1 : 7.0
  );

  const earlyCard = comparisonCard(
    earlyX,
    CARDY,
    'WEEKS 1–8',
    'Earlier naive rule',
    '2 cases',
    NC
  );

  const laterCard = comparisonCard(
    lateX,
    CARDY,
    'WEEKS 9–12',
    'Later Holt model',
    '1.5 cases',
    NC
  );

  const oldCompare = arrow(
    [
      earlyX + CARDW / 2 + 0.03,
      CARDY,
      0
    ],
    [
      lateX - CARDW / 2 - 0.03,
      CARDY,
      0
    ],
    C.green
  );

  const maseComparison = pill(
    'MASE = 0.75',
    C.green,
    20
  );

  maseComparison.moveTo([
    TCX,
    CARDY - CARDH / 2 - 0.48,
    0
  ]);

  const periodWarning = txt(
    'Different periods of time',
    P ? 19 : 18,
    C.amber,
    [
      TCX,
      CARDY + CARDH / 2 + 0.44,
      0
    ]
  );

  await until(S(36));
  await play(
    ...fadeOut([
      ...scaleParts,
      ...scaleDots,
      belowLabel,
      aboveLabel,
      scaledUnitNote,
      comparisonNote
    ]),
    new M.FadeIn(trapTitle),
    new M.FadeIn(earlyCard),
    new M.FadeIn(laterCard),
    new M.FadeIn(oldCompare),
    new M.FadeIn(maseComparison),
    new M.FadeIn(periodWarning),
    ...fbox([
      ['MASE < 1 means:', C.amber],
      'later model miss',
      '< earlier naive miss',
      'not necessarily a win',
      'on the same later weeks'
    ], C.amber),
    ...say('TRAP: BELOW 1 IS NOT A HEAD-TO-HEAD WIN', C.amber)
  );

  const headTitle = txt(
    'A FAIR HEAD-TO-HEAD TEST',
    P ? 22 : 20,
    C.green,
    [TCX, P ? 2.70 : 1.45, 0],
    true
  );

  const laterNaiveCard = comparisonCard(
    earlyX,
    CARDY,
    'WEEKS 9–12',
    'Later naive rule',
    'Test separately',
    C.amber
  );

  const samePeriod = txt(
    'Same target weeks for both rules',
    P ? 18 : 18,
    C.green,
    [
      TCX,
      CARDY + CARDH / 2 + 0.44,
      0
    ]
  );

  const headToHeadTag = pill(
    'COMPARE THE TWO LATER SCORES',
    C.green,
    P ? 17 : 17
  );

  headToHeadTag.moveTo([
    TCX,
    CARDY - CARDH / 2 - 0.48,
    0
  ]);

  await until(S(37));
  await play(
    new M.Transform(trapTitle, headTitle),
    new M.Transform(earlyCard, laterNaiveCard),
    new M.Transform(periodWarning, samePeriod),
    new M.FadeOut(oldCompare),
    new M.FadeOut(maseComparison),
    new M.FadeIn(headToHeadTag),
    ...fbox([
      ['head-to-head comparison', C.green],
      'test naive on weeks 9–12',
      'test model on weeks 9–12',
      'compare their misses'
    ], C.green),
    ...say('TEST BOTH RULES ON THE SAME LATER WEEKS', C.green)
  );

  // ------------------------------------------------------------
  // 38: Recap.
  // Each store's later average miss divided by its own
  // earlier naive average miss.
  // ------------------------------------------------------------

  const FCX = P ? 0 : -2.55;
  const FX = P ? 1.79 : 1.86;

  const FWIDTH = P ? 3.10 : 3.32;
  const FHEIGHT = P ? 3.34 : 2.96;

  const FY = P ? 0.05 : -0.30;

  function finalStoreCard(
    xx,
    title,
    later,
    earlier,
    scaled,
    color
  ) {
    const parts = [];

    const r = rounded(
      FWIDTH,
      FHEIGHT,
      [xx, FY, 0],
      color
    );

    parts.push(r);

    const name = txt(
      title,
      P ? 23 : 22,
      color,
      [
        xx,
        FY + FHEIGHT * 0.36,
        0
      ],
      true
    );

    parts.push(name);

    const laterLabel = txt(
      'Later average miss',
      P ? 16 : 16,
      C.muted,
      [
        xx,
        FY + FHEIGHT * 0.19,
        0
      ],
      false,
      FWIDTH - 0.30
    );

    parts.push(laterLabel);

    const numerator = txt(
      `${later}`,
      P ? 28 : 26,
      color,
      [
        xx,
        FY + FHEIGHT * 0.04,
        0
      ],
      true
    );

    parts.push(numerator);

    const fractionLine = line(
      [
        xx - FWIDTH * 0.33,
        FY - FHEIGHT * 0.08,
        0
      ],
      [
        xx + FWIDTH * 0.33,
        FY - FHEIGHT * 0.08,
        0
      ],
      C.ink,
      2
    );

    parts.push(fractionLine);

    const denominator = txt(
      `${earlier}`,
      P ? 27 : 25,
      color,
      [
        xx,
        FY - FHEIGHT * 0.19,
        0
      ],
      true
    );

    parts.push(denominator);

    const earlierLabel = txt(
      'Earlier naive miss',
      P ? 16 : 16,
      C.muted,
      [
        xx,
        FY - FHEIGHT * 0.30,
        0
      ],
      false,
      FWIDTH - 0.28
    );

    parts.push(earlierLabel);

    const result = pill(
      `MASE = ${scaled}`,
      color,
      P ? 20 : 19
    );

    if (result.getWidth() > FWIDTH - 0.22) {
      result.scale(
        (FWIDTH - 0.22) / result.getWidth()
      );
    }

    result.moveTo([
      xx,
      FY - FHEIGHT / 2 - 0.43,
      0
    ]);

    parts.push(result);

    return new M.VGroup(...parts);
  }

  const finalNorth = finalStoreCard(
    FCX - FX,
    'NORTH',
    1.5,
    2,
    0.75,
    NC
  );

  const finalEast = finalStoreCard(
    FCX + FX,
    'EAST',
    30,
    20,
    1.5,
    EC
  );

  const finalTitle = txt(
    'MEAN ABSOLUTE SCALED ERROR',
    P ? 22 : 20,
    C.green,
    [FCX, P ? 2.64 : 1.52, 0],
    true,
    P ? FW - 1.05 : 7.0
  );

  await until(S(38));
  await play(
    ...fadeOut([
      trapTitle,
      earlyCard,
      laterCard,
      periodWarning,
      headToHeadTag
    ]),
    new M.FadeIn(finalTitle),
    new M.FadeIn(finalNorth),
    new M.FadeIn(finalEast),
    ...fbox([
      ['MASE =', C.green],
      'later model average miss',
      '÷ earlier naive average',
      ['North = 0.75', NC],
      ['East  = 1.5', EC],
      'same store in each ratio'
    ], C.green),
    ...say('LATER MISS ÷ OWN EARLIER NAIVE MISS', C.green)
  );

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          finalNorth,
          { color: NC }
        ),
        new M.Indicate(
          finalEast,
          { color: EC }
        )
      ],
      {
        lagRatio: 0.45,
        runTime: Math.min(
          2.6,
          Math.max(
            1.1,
            E(38) - S(38) - 1.6
          )
        )
      }
    )
  );
}
