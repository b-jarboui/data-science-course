// lesson 11.3.6
// Residual autocorrelation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Fixed shared chapter data.
  const RESIDUALS = [3, 2, 2, 1, -1, -2, -3, -2];

  const N = 52;
  const PAIRS = 51;
  const N_PLUS_TWO = 54;

  const R1 = 0.4;
  const R1_SQUARED = 0.16;
  const Q1 = N * N_PLUS_TWO * R1_SQUARED / PAIRS;

  const R2 = 0.1;
  const R2_SQUARED = 0.01;
  const Q2 = N * N_PLUS_TWO * R2_SQUARED / PAIRS;

  const CUTOFF = 3.84;

  const NC = C.cyan;
  const FC = C.amber;
  const POS = C.cyan;
  const NEG = C.violet;
  const GC = C.green;
  const WC = C.amber;

  // Responsive layout.
  // Phone: 8 × 14.22, content between y=-5.5 and y=4.3.
  // Laptop: 14.22 × 8, content between y=-3.0 and y=2.3.

  const CX = P ? 0 : -2.65;
  const PILL = P ? [0, 3.72, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -4.02, 0] : [4.30, -0.35, 0];

  const say = (s, c = NC) => showA(s, c, PILL);

  const fadeIn = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  const signed = v =>
    v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0';

  const signColor = v =>
    v >= 0 ? POS : NEG;

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
    opacity = 0.96
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.16,
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

  function arrow(
    a, b,
    color = FC,
    strokeWidth = 3,
    headSize = 0.15
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / length;
    const uy = dy / length;

    const wing = headSize * 0.48;

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(
        b,
        [
          b[0] - headSize * ux + wing * uy,
          b[1] - headSize * uy - wing * ux,
          0
        ],
        color,
        strokeWidth
      ),
      line(
        b,
        [
          b[0] - headSize * ux - wing * uy,
          b[1] - headSize * uy + wing * ux,
          0
        ],
        color,
        strokeWidth
      )
    );
  }

  function glowDot(p, color, radius = 0.09) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 2.1,
      color
    });

    halo.setFill(color, 0.18);

    const d = new M.Dot({
      point: p,
      radius,
      color
    });

    return new M.VGroup(halo, d);
  }

  function ring(
    p,
    radius,
    color,
    strokeWidth = 3
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function tag(
    s, color, p,
    size = 17,
    maxw = FW - 1.1
  ) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function indicate(o, color = GC, runTime = 0.8) {
    return new M.Indicate(o, {
      color,
      runTime
    });
  }

  // Formula box: follows the approved reference lesson.

  let boxNow = null;

  function fbox(lines, color = NC, position = BOXP) {
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
    const top = position[1] + ht / 2 - 0.2 - lh / 2;

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
    const maxh = P ? 2.55 : 3.65;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(position);

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
  // 0: North's grocer wants to know whether forecast misses
  // keep pointing in the same direction.
  // ------------------------------------------------------------

  function waterCase(cx, cy) {
    const parts = [];

    for (let k = 0; k < 3; k++) {
      const bx = cx + (k - 1) * 0.42;

      const body = rounded(
        0.31,
        0.84,
        [bx, cy + 0.17, 0],
        NC
      );

      body.setFill(NC, 0.30);

      const neck = rect(
        0.14,
        0.21,
        [bx, cy + 0.65, 0],
        NC,
        0.45,
        1
      );

      const cap = rect(
        0.20,
        0.10,
        [bx, cy + 0.80, 0],
        C.ink,
        0.9,
        1
      );

      const label = rect(
        0.29,
        0.20,
        [bx, cy + 0.18, 0],
        NC,
        0.85,
        1
      );

      parts.push(body, neck, cap, label);
    }

    const crate = rounded(
      1.48,
      0.62,
      [cx, cy - 0.29, 0],
      NC
    );

    crate.setFill(NC, 0.22);

    parts.push(crate);

    return new M.VGroup(...parts);
  }

  const INTRO_Y = P ? 0.50 : 0.15;

  const cases = [-1.75, 0, 1.75].map(
    xx => waterCase(xx, INTRO_Y)
  );

  const northTag = tag(
    'NORTH',
    NC,
    [0, INTRO_Y + 1.30, 0],
    23
  );

  const questionY = P ? -1.35 : -1.27;

  const introUp = arrow(
    [-1.55, questionY - 0.44, 0],
    [-1.55, questionY + 0.44, 0],
    POS,
    4
  );

  const introDown = arrow(
    [1.55, questionY + 0.44, 0],
    [1.55, questionY - 0.44, 0],
    NEG,
    4
  );

  const question = txt(
    '?',
    38,
    FC,
    [0, questionY, 0],
    true
  );

  await until(S(0));
  await play(
    new M.FadeIn(northTag),
    new M.LaggedStart(
      cases.map(c => new M.FadeIn(c)),
      { lagRatio: 0.15, runTime: 1.3 }
    ),
    new M.FadeIn(introUp),
    new M.FadeIn(introDown),
    new M.FadeIn(question),
    ...say('DO OUR MISSES KEEP POINTING THE SAME WAY?')
  );

  // ------------------------------------------------------------
  // 1–6: From forecast gaps to signed residuals.
  //
  // Reuse the exact earlier North examples:
  // Week 9: forecast 46, actual 49, residual +3.
  // Week 10: forecast 49, actual 48, residual −1.
  // ------------------------------------------------------------

  const DSP = P ? 2.65 : 3.12;

  const dx1 = CX - DSP / 2;
  const dx2 = CX + DSP / 2;

  const DZERO = P ? -0.43 : -0.62;
  const DUNIT = P ? 0.72 : 0.42;

  const dy = v => DZERO + (v - 46) * DUNIT;

  const DEMO_LEFT = dx1 - 1.15;
  const DEMO_RIGHT = dx2 + 1.15;

  const demoParts = [];

  const demoTitle = txt(
    'FORECAST AND ACTUAL',
    P ? 23 : 21,
    C.ink,
    [CX, P ? 2.78 : 1.48, 0],
    true
  );

  demoParts.push(demoTitle);

  for (const v of [46, 47, 48, 49]) {
    const guide = line(
      [DEMO_LEFT, dy(v), 0],
      [DEMO_RIGHT, dy(v), 0],
      C.muted,
      0.65
    );

    const lab = txt(
      v,
      P ? 16 : 17,
      C.muted,
      [DEMO_LEFT - 0.27, dy(v), 0],
      true
    );

    demoParts.push(guide, lab);
  }

  const demoFloor = line(
    [DEMO_LEFT, dy(46) - 0.32, 0],
    [DEMO_RIGHT, dy(46) - 0.32, 0],
    C.muted,
    2
  );

  const week9 = txt(
    'WEEK 9',
    19,
    C.muted,
    [dx1, dy(46) - 0.62, 0],
    true
  );

  const week10 = txt(
    'WEEK 10',
    19,
    C.muted,
    [dx2, dy(46) - 0.62, 0],
    true
  );

  demoParts.push(
    demoFloor,
    week9,
    week10
  );

  function demoPair(xx, f, a) {
    const forecast = ring(
      [xx, dy(f), 0],
      P ? 0.13 : 0.12,
      FC,
      3
    );

    const actual = glowDot(
      [xx, dy(a), 0],
      NC,
      P ? 0.095 : 0.09
    );

    const fLabel = txt(
      `guess ${f}`,
      P ? 16 : 17,
      FC,
      [
        xx - 0.53,
        dy(f) + (f > a ? 0.24 : -0.22),
        0
      ],
      true,
      1.30
    );

    const aLabel = txt(
      `actual ${a}`,
      P ? 16 : 17,
      NC,
      [
        xx + 0.78,
        dy(a) + (a > f ? -0.08 : 0.23),
        0
      ],
      true,
      1.30
    );

    return [
      forecast,
      actual,
      fLabel,
      aLabel
    ];
  }

  const positivePair = demoPair(
    dx1,
    46,
    49
  );

  const negativePair = demoPair(
    dx2,
    49,
    48
  );

  const legendF = tag(
    'HOLLOW = FORECAST',
    FC,
    [
      CX - (P ? 1.64 : 1.72),
      P ? -2.35 : -2.35,
      0
    ],
    P ? 15 : 15,
    P ? 3.10 : 3.20
  );

  const legendA = tag(
    'FILLED = ACTUAL',
    NC,
    [
      CX + (P ? 1.64 : 1.72),
      P ? -2.35 : -2.35,
      0
    ],
    P ? 15 : 15,
    P ? 3.10 : 3.20
  );

  await until(S(1));
  await play(
    ...fadeOut([
      ...cases,
      northTag,
      introUp,
      introDown,
      question
    ]),
    ...fadeIn(demoParts),
    ...fadeIn(positivePair),
    ...fadeIn(negativePair),
    new M.FadeIn(legendF),
    new M.FadeIn(legendA),
    ...say('HOLLOW GUESS, FILLED ACTUAL')
  );

  const positiveGap = arrow(
    [dx1, dy(46) + 0.14, 0],
    [dx1, dy(49) - 0.12, 0],
    POS,
    4,
    0.16
  );

  const negativeGap = arrow(
    [dx2, dy(49) - 0.14, 0],
    [dx2, dy(48) + 0.12, 0],
    NEG,
    4,
    0.14
  );

  const positiveNumber = txt(
    '+3',
    28,
    POS,
    [
      dx1 - 0.37,
      (dy(46) + dy(49)) / 2,
      0
    ],
    true
  );

  const negativeNumber = txt(
    '−1',
    28,
    NEG,
    [
      dx2 - 0.42,
      (dy(49) + dy(48)) / 2,
      0
    ],
    true
  );

  await until(S(2));
  await play(
    new M.FadeIn(positiveGap),
    new M.FadeIn(positiveNumber),
    ...fbox([
      'actual   = 49',
      'forecast = 46',
      ['49 − 46 = +3', POS]
    ], POS),
    ...say('ACTUAL HIGHER: DRAW THE GAP UP', POS)
  );

  await until(S(3));
  await play(
    new M.FadeIn(negativeGap),
    new M.FadeIn(negativeNumber),
    ...fbox([
      'actual   = 48',
      'forecast = 49',
      ['48 − 49 = −1', NEG]
    ], NEG),
    ...say('ACTUAL LOWER: DRAW THE GAP DOWN', NEG)
  );

  const residualTitle = txt(
    'SIGNED GAPS: RESIDUALS',
    P ? 23 : 21,
    GC,
    [CX, P ? 2.78 : 1.48, 0],
    true
  );

  await until(S(4));
  await play(
    new M.Transform(demoTitle, residualTitle),
    ...fbox([
      ['Residual', GC],
      'actual count',
      '− forecast count',
      ['keep the sign', GC]
    ], GC),
    ...say('RESIDUAL = ACTUAL MINUS FORECAST', GC)
  );

  const positiveMeaning = tag(
    'EXPECTED TOO FEW',
    POS,
    [
      dx1,
      P ? -1.65 : -1.77,
      0
    ],
    15,
    DSP - 0.13
  );

  const negativeMeaning = tag(
    'EXPECTED TOO MANY',
    NEG,
    [
      dx2,
      P ? -1.65 : -1.77,
      0
    ],
    15,
    DSP - 0.13
  );

  await until(S(5));
  await play(
    new M.FadeIn(positiveMeaning),
    indicate(positiveGap, POS),
    ...fbox([
      ['Positive residual: +3', POS],
      'actual > forecast',
      'We expected too few.'
    ], POS),
    ...say('PLUS: THE FORECAST WAS TOO LOW', POS)
  );

  await until(S(6));
  await play(
    new M.FadeIn(negativeMeaning),
    indicate(negativeGap, NEG),
    ...fbox([
      ['Negative residual: −1', NEG],
      'actual < forecast',
      'We expected too many.'
    ], NEG),
    ...say('MINUS: THE FORECAST WAS TOO HIGH', NEG)
  );

  // ------------------------------------------------------------
  // 7: Recenter the signed gaps at zero.
  // Zero means forecast and actual agree exactly.
  // ------------------------------------------------------------

  const RY = P ? -0.30 : -0.43;
  const RU = P ? 0.64 : 0.44;
  const RSP = P ? 0.77 : 0.88;

  const rx = k => CX + (k - 3.5) * RSP;
  const ry = v => RY + v * RU;

  const RLEFT = rx(0) - RSP * 0.55;
  const RRIGHT = rx(7) + RSP * 0.55;

  const residualChart = [];

  const chartTitle = txt(
    'RESIDUALS OVER TIME',
    P ? 23 : 21,
    GC,
    [CX, P ? 2.78 : 1.50, 0],
    true
  );

  residualChart.push(chartTitle);

  const zeroLine = line(
    [RLEFT, RY, 0],
    [RRIGHT, RY, 0],
    C.ink,
    2.7
  );

  const zeroLabel = txt(
    '0',
    22,
    C.ink,
    [RLEFT - 0.26, RY, 0],
    true
  );

  residualChart.push(
    zeroLine,
    zeroLabel
  );

  for (const v of [-3, -2, -1, 1, 2, 3]) {
    const guide = line(
      [RLEFT, ry(v), 0],
      [RRIGHT, ry(v), 0],
      C.muted,
      0.65
    );

    const lab = txt(
      signed(v),
      P ? 15 : 16,
      signColor(v),
      [RLEFT - 0.27, ry(v), 0],
      true,
      0.45
    );

    residualChart.push(guide, lab);
  }

  const residualUnit = txt(
    'week',
    P ? 17 : 16,
    C.muted,
    [
      CX,
      P ? -3.0 : -2.62,
      0
    ]
  );

  residualChart.push(residualUnit);

  function residualStem(k, v, color = signColor(v)) {
    return arrow(
      [rx(k), RY, 0],
      [rx(k), ry(v), 0],
      color,
      3.2,
      0.12
    );
  }

  const exampleUp = residualStem(2, 3);
  const exampleDown = residualStem(5, -1);

  const exampleUpLabel = txt(
    '+3',
    22,
    POS,
    [rx(2), ry(3) + 0.27, 0],
    true
  );

  const exampleDownLabel = txt(
    '−1',
    22,
    NEG,
    [rx(5), ry(-1) - 0.27, 0],
    true
  );

  await until(S(7));
  await play(
    ...fadeOut([
      ...demoParts,
      ...positivePair,
      ...negativePair,
      legendF,
      legendA,
      positiveMeaning,
      negativeMeaning,
      positiveNumber,
      negativeNumber
    ]),
    ...fadeIn(residualChart),
    new M.Transform(
      positiveGap,
      exampleUp
    ),
    new M.Transform(
      negativeGap,
      exampleDown
    ),
    new M.FadeIn(exampleUpLabel),
    new M.FadeIn(exampleDownLabel),
    ...fbox([
      ['Center at zero', GC],
      ['+3: 3 above zero', POS],
      ['−1: 1 below zero', NEG],
      '0 means no miss'
    ], GC),
    ...say('PUT EVERY SIGNED GAP ON A ZERO LINE', GC)
  );

  // ------------------------------------------------------------
  // 8–11: Eight residuals from North's longer record.
  // The first four are positive; the next four are negative.
  // This is an excerpt, not the full 52-week record.
  // ------------------------------------------------------------

  const weekSlots = [];

  for (let k = 0; k < 8; k++) {
    const guide = line(
      [rx(k), ry(-3), 0],
      [rx(k), ry(3), 0],
      C.muted,
      0.60
    );

    const tick = line(
      [rx(k), RY - 0.055, 0],
      [rx(k), RY + 0.055, 0],
      C.muted,
      1.5
    );

    const label = txt(
      k + 1,
      P ? 15 : 16,
      C.muted,
      [
        rx(k),
        ry(-3) - (P ? 0.5 : 0.5),
        0
      ],
      true
    );

    weekSlots.push(guide, tick, label);
  }

  const excerptTag = tag(
    '8-WEEK EXCERPT',
    C.muted,
    [
      CX,
      P ? 2.18 : 1.02,
      0
    ],
    15
  );

  await until(S(8));
  await play(
    ...fadeOut([
      positiveGap,
      negativeGap,
      exampleUpLabel,
      exampleDownLabel
    ]),
    ...fadeIn(weekSlots),
    new M.FadeIn(excerptTag),
    ...clearBox(),
    ...say('EIGHT WEEKS FROM THE RECORD')
  );

  const residualStems = [];
  const residualDots = [];
  const residualLabels = [];

  for (let k = 0; k < 8; k++) {
    const v = RESIDUALS[k];
    const color = signColor(v);

    residualStems.push(
      residualStem(k, v)
    );

    residualDots.push(
      glowDot(
        [rx(k), ry(v), 0],
        color,
        P ? 0.074 : 0.07
      )
    );

    residualLabels.push(
      txt(
        signed(v),
        P ? 18 : 18,
        color,
        [
          rx(k) + 0.3,
          ry(v),
          0
        ],
        true,
        RSP - 0.08
      )
    );
  }

  function showResidual(k) {
    return [
      new M.FadeIn(
        residualStems[k],
        { runTime: 0.45 }
      ),
      new M.FadeIn(
        residualDots[k],
        { runTime: 0.45 }
      ),
      new M.FadeIn(
        residualLabels[k],
        { runTime: 0.45 }
      )
    ];
  }

  await until(S(9));
  await play(
    new M.LaggedStart(
      [0, 1, 2, 3].map(k =>
        new M.LaggedStart(
          showResidual(k),
          { lagRatio: 0.05 }
        )
      ),
      { lagRatio: 0.45, runTime: 2.6 }
    ),
    ...say('PLUS THREE, TWO, TWO, ONE', POS)
  );

  await until(S(10));
  await play(
    new M.LaggedStart(
      [4, 5, 6, 7].map(k =>
        new M.LaggedStart(
          showResidual(k),
          { lagRatio: 0.05 }
        )
      ),
      { lagRatio: 0.45, runTime: 2.6 }
    ),
    ...say('MINUS ONE, TWO, THREE, TWO', NEG)
  );

  // Outline the two runs using coordinates.
  // Do not wrap already visible residual objects into new groups.

  const positiveRun = rounded(
    3 * RSP + 0.85,
    3 * RU + 0.45,
    [
      (rx(0) + rx(3)) / 2 + 0.12,
      RY + (3 * RU + 0.25) / 2,
      0
    ],
    POS,
    0
  );

  positiveRun.setFill(POS, 0.045);

  const negativeRun = rounded(
    3 * RSP + 0.85,
    3 * RU + 0.45,
    [
      (rx(4) + rx(7)) / 2 + 0.12,
      RY - (3 * RU + 0.25) / 2,
      0
    ],
    NEG,
    0
  );

  negativeRun.setFill(NEG, 0.045);

  const positiveRunTag = tag(
    'PLUSES TOGETHER',
    POS,
    [
      (rx(0) + rx(3)) / 2,
      RY - 0.47,
      0
    ],
    15,
    3 * RSP + 0.35
  );

  const negativeRunTag = tag(
    'MINUSES TOGETHER',
    NEG,
    [
      (rx(4) + rx(7)) / 2,
      RY + 0.47,
      0
    ],
    15,
    3 * RSP + 0.35
  );

  await until(S(11));
  await play(
    new M.FadeOut(excerptTag),
    new M.Create(positiveRun),
    new M.Create(negativeRun),
    new M.FadeIn(positiveRunTag),
    new M.FadeIn(negativeRunTag),
    ...fbox([
      ['Notice the runs', GC],
      ['+ + + +', POS],
      ['− − − −', NEG],
      'Similar signs together.'
    ], GC),
    ...say('PLUSES CLUSTER, THEN MINUSES CLUSTER', GC)
  );

  // ------------------------------------------------------------
  // 12: Ask whether that one-week link persists across
  // the full 52-week record.
  //
  // The full residual series is not supplied.
  // Show its length without inventing its missing values.
  // ------------------------------------------------------------

  const fullRecordTag = tag(
    '52 WEEKS IN THE FULL RECORD',
    GC,
    [
      CX,
      P ? -3.3 : -2.8,
      0
    ],
    P ? 17 : 16,
    P ? 6.5 : 7.0
  );

  await until(S(12));
  await play(
    new M.FadeOut(residualUnit),
    new M.FadeIn(fullRecordTag),
    ...fbox([
      'This picture: 8 weeks',
      ['Full record: 52 weeks', GC],
      'Does the one-week',
      'link persist?'
    ], GC),
    ...say('CHECK THE FULL 52-WEEK RECORD', GC)
  );

  // ------------------------------------------------------------
  // 13–14: Pair each residual with the preceding residual.
  //
  // Display the seven neighboring pairs from the excerpt.
  // Full record: 52 values, 51 neighboring pairs.
  // ------------------------------------------------------------

  const PSP = P ? 0.78 : 0.91;
  const PCX = P ? 0.48 : -2.25;

  const px = k => PCX + (k - 3) * PSP;

  const PREV_Y = P ? 1.02 : 0.48;
  const THIS_Y = P ? -0.15 : -0.54;

  const PAIR_W = PSP * 0.75;
  const PAIR_H = P ? 0.54 : 0.53;

  const pairingParts = [];
  const previousTiles = [];
  const currentTiles = [];
  const pairConnectors = [];
  const pairLabels = [];

  const pairingTitle = txt(
    'PAIR NEIGHBORING WEEKS',
    P ? 23 : 21,
    GC,
    [CX, P ? 2.78 : 1.47, 0],
    true
  );

  pairingParts.push(pairingTitle);

  const previousHeading = txt(
    'PREVIOUS',
    P ? 14 : 15,
    C.muted,
    [
      px(0) - PSP * 0.92,
      PREV_Y,
      0
    ],
    true,
    1.05
  );

  const currentHeading = txt(
    'THIS WEEK',
    P ? 14 : 15,
    C.muted,
    [
      px(0) - PSP * 0.92,
      THIS_Y,
      0
    ],
    true,
    1.05
  );

  pairingParts.push(
    previousHeading,
    currentHeading
  );

  function residualTile(v, xx, yy) {
    const color = signColor(v);

    const r = rounded(
      PAIR_W,
      PAIR_H,
      [xx, yy, 0],
      color
    );

    r.setFill(color, 0.20);

    const lab = txt(
      signed(v),
      P ? 20 : 21,
      color,
      [xx, yy, 0],
      true,
      PAIR_W - 0.08
    );

    return new M.VGroup(r, lab);
  }

  const PAIR_DATA = RESIDUALS.slice(1).map(
    (v, k) => [RESIDUALS[k], v]
  );

  PAIR_DATA.forEach(([a, b], k) => {
    previousTiles.push(
      residualTile(a, px(k), PREV_Y)
    );

    currentTiles.push(
      residualTile(b, px(k), THIS_Y)
    );

    pairConnectors.push(
      arrow(
        [
          px(k),
          THIS_Y + PAIR_H / 2 + 0.045,
          0
        ],
        [
          px(k),
          PREV_Y - PAIR_H / 2 - 0.045,
          0
        ],
        C.muted,
        2,
        0.11
      )
    );

    pairLabels.push(
      txt(
        `${k + 1}→${k + 2}`,
        P ? 14 : 15,
        C.muted,
        [px(k), THIS_Y - 0.47, 0],
        true,
        PSP - 0.07
      )
    );
  });

  const pairCount = tag(
    '7 PAIRS IN THIS EXCERPT',
    GC,
    [
      CX,
      P ? -2.20 : -1.63,
      0
    ],
    17
  );

  await until(S(13));
  await play(
    ...fadeOut([
      ...residualChart.filter(o => o !== residualUnit),
      ...weekSlots,
      ...residualStems,
      ...residualDots,
      ...residualLabels,
      excerptTag,
      positiveRun,
      negativeRun,
      positiveRunTag,
      negativeRunTag,
      fullRecordTag
    ]),
    ...fadeIn(pairingParts),
    ...fadeIn(previousTiles),
    ...fadeIn(currentTiles),
    ...fadeIn(pairLabels),
    new M.LaggedStart(
      pairConnectors.map(a => new M.FadeIn(a)),
      { lagRatio: 0.12, runTime: 1.5 }
    ),
    new M.FadeIn(pairCount),
    ...fbox([
      ['Make neighboring pairs', GC],
      '(+3, +2)',
      '(+2, +2)',
      '(+2, +1)',
      '...'
    ], GC),
    ...say('PAIR EACH GAP WITH THE ONE JUST BEFORE IT', GC)
  );

  const lagOutline = rounded(
    PAIR_W + 0.17,
    PREV_Y - THIS_Y + PAIR_H + 0.17,
    [
      px(0),
      (PREV_Y + THIS_Y) / 2,
      0
    ],
    FC,
    0
  );

  lagOutline.setFill(FC, 0);

  const lagTag = tag(
    'ONE WEEK BACK',
    FC,
    [
      CX,
      P ? 1.95 : 0.99,
      0
    ],
    17
  );

  await until(S(14));
  await play(
    new M.Create(lagOutline),
    new M.FadeIn(lagTag),
    indicate(pairConnectors[0], FC),
    ...fbox([
      ['Lag one', FC],
      'Look one week back.',
      'Full record:',
      ['52 − 1 = 51 pairs', GC]
    ], FC),
    ...say('LAG ONE = ONE WEEK BACK', FC)
  );

  // ------------------------------------------------------------
  // 15–17: Correlation, autocorrelation,
  // and residual autocorrelation.
  //
  // Use the excerpt pairs to make a small scatter picture.
  // Do not label its correlation as the full-record value 0.4.
  // ------------------------------------------------------------

  const sameSignPairs = [0, 1, 2, 4, 5, 6];

  const pairHighlights = sameSignPairs.map(k =>
    rounded(
      PAIR_W + 0.10,
      PREV_Y - THIS_Y + PAIR_H + 0.12,
      [
        px(k),
        (PREV_Y + THIS_Y) / 2,
        0
      ],
      GC,
      0
    )
  );

  const transitionOutline = rounded(
    PAIR_W + 0.12,
    PREV_Y - THIS_Y + PAIR_H + 0.14,
    [
      px(3),
      (PREV_Y + THIS_Y) / 2,
      0
    ],
    WC,
    0
  );

  await until(S(15));
  await play(
    new M.FadeOut(lagOutline),
    ...fadeIn(pairHighlights),
    new M.Create(transitionOutline),
    ...fbox([
      ['Correlation', GC],
      'How strongly paired',
      'numbers move together.',
      'Not just the signs.'
    ], GC),
    ...say('CORRELATION MEASURES HOW PAIRS MOVE TOGETHER', GC)
  );

  const AX = CX;
  const AY = P ? -0.25 : -0.49;

  const AU = P ? 0.68 : 0.44;

  const ap = (a, b) => [
    AX + a * AU,
    AY + b * AU,
    0
  ];

  const scatterParts = [];

  const scatterTitle = txt(
    'A SERIES PAIRED WITH ITSELF',
    P ? 22 : 20,
    GC,
    [CX, P ? 2.78 : 1.46, 0],
    true
  );

  scatterParts.push(scatterTitle);

  for (let v = -3; v <= 3; v++) {
    scatterParts.push(
      line(
        ap(-3.35, v),
        ap(3.35, v),
        v === 0 ? C.ink : C.muted,
        v === 0 ? 2.2 : 0.60
      )
    );

    scatterParts.push(
      line(
        ap(v, -3.35),
        ap(v, 3.35),
        v === 0 ? C.ink : C.muted,
        v === 0 ? 2.2 : 0.60
      )
    );

    scatterParts.push(
      txt(
        signed(v),
        P ? 13 : 14,
        C.muted,
        [
          AX + v * AU,
          AY - 3.35 * AU - 0.22,
          0
        ],
        true
      )
    );

    if (v !== 0) {
      scatterParts.push(
        txt(
          signed(v),
          P ? 13 : 14,
          C.muted,
          [
            AX - 3.35 * AU - 0.25,
            AY + v * AU,
            0
          ],
          true
        )
      );
    }
  }

  const scatterXLabel = txt(
    'Previous residual',
    P ? 16 : 16,
    C.muted,
    [
      AX,
      AY - 3.35 * AU - 0.58,
      0
    ]
  );

  const scatterYLabel = txt(
    'This residual',
    P ? 15 : 15,
    C.muted,
    [
      AX - 2.0 * AU,
      AY + 3.35 * AU + 0.22,
      0
    ],
    false,
    P ? 2.45 : 2.4
  );

  scatterParts.push(
    scatterXLabel,
    scatterYLabel
  );

  const scatterDots = PAIR_DATA.map(([a, b]) =>
    glowDot(
      ap(a, b),
      a * b >= 0 ? NC : FC,
      P ? 0.08 : 0.075
    )
  );

  const scatterNote = tag(
    '7 PAIRS SHOWN',
    C.muted,
    [
      AX + (P ? 1.9 : 2.2),
      AY - (P ? 1.70 : 1.18),
      0
    ],
    15,
    P ? 2.3 : 2.5
  );

  await until(S(16));
  await play(
    ...fadeOut([
      ...pairingParts,
      ...previousTiles,
      ...currentTiles,
      ...pairConnectors,
      ...pairLabels,
      ...pairHighlights,
      transitionOutline,
      pairCount,
      lagTag
    ]),
    ...fadeIn(scatterParts),
    new M.LaggedStart(
      scatterDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.13, runTime: 1.45 }
    ),
    new M.FadeIn(scatterNote),
    ...fbox([
      ['Autocorrelation', GC],
      'Correlation of a series',
      'with its own earlier',
      'values.'
    ], GC),
    ...say('AUTOCORRELATION = A SERIES LINKED TO ITSELF', GC)
  );

  const autoTitle = txt(
    'RESIDUAL AUTOCORRELATION',
    P ? 22 : 20,
    GC,
    [CX, P ? 2.78 : 1.46, 0],
    true
  );

  await until(S(17));
  await play(
    new M.Transform(scatterTitle, autoTitle),
    ...fbox([
      ['Residual autocorrelation', GC],
      'Use signed forecast gaps.',
      'Pair them with their',
      'own earlier values.'
    ], GC),
    ...say('CHECK THE AUTOCORRELATION OF THE RESIDUALS', GC)
  );

  // ------------------------------------------------------------
  // 18: The full record has lag-one correlation 0.4.
  //
  // Only the supplied full-record statistic is shown.
  // The 7 plotted pairs are an illustrative excerpt.
  // ------------------------------------------------------------

  const LCX = CX;
  const LLEN = P ? 6.2 : 6.6;
  const LY = P ? 0.30 : -0.10;

  const lx = v => LCX + v * LLEN / 2;

  const correlationParts = [];

  const corrTitle = txt(
    'LAG-ONE CORRELATION',
    P ? 23 : 21,
    GC,
    [LCX, P ? 2.78 : 1.46, 0],
    true
  );

  correlationParts.push(corrTitle);

  const corrLine = line(
    [lx(-1), LY, 0],
    [lx(1), LY, 0],
    C.muted,
    3
  );

  correlationParts.push(corrLine);

  for (const v of [-1, -0.5, 0, 0.5, 1]) {
    correlationParts.push(
      line(
        [lx(v), LY - 0.10, 0],
        [lx(v), LY + 0.10, 0],
        v === 0 ? C.ink : C.muted,
        v === 0 ? 2.5 : 1.6
      )
    );

    correlationParts.push(
      txt(
        v,
        18,
        v === 0 ? C.ink : C.muted,
        [lx(v), LY - 0.34, 0],
        true
      )
    );
  }

  const leftCorr = txt(
    'Tend to move oppositely',
    P ? 16 : 16,
    NEG,
    [
      (lx(-1) + lx(0)) / 2,
      LY - 0.83,
      0
    ],
    false,
    LLEN / 2 - 0.13
  );

  const rightCorr = txt(
    'Tend to move together',
    P ? 16 : 16,
    POS,
    [
      (lx(0) + lx(1)) / 2,
      LY - 0.83,
      0
    ],
    false,
    LLEN / 2 - 0.13
  );

  const fullRecordNote = tag(
    'FULL RECORD: 52 WEEKS',
    GC,
    [
      LCX,
      P ? -2.10 : -1.87,
      0
    ],
    17
  );

  correlationParts.push(
    leftCorr,
    rightCorr,
    fullRecordNote
  );

  const rDot = glowDot(
    [lx(R1), LY, 0],
    NC,
    0.115
  );

  const rLabel = txt(
    '0.4',
    31,
    NC,
    [lx(R1), LY + 0.45, 0],
    true
  );

  await until(S(18));
  await play(
    ...fadeOut([
      ...scatterParts,
      ...scatterDots,
      scatterNote
    ]),
    ...fadeIn(correlationParts),
    new M.FadeIn(rDot),
    new M.FadeIn(rLabel),
    ...fbox([
      '52 residuals',
      '51 neighboring pairs',
      ['lag-one r = 0.4', NC]
    ], NC),
    ...say('FULL-RECORD LAG-ONE CORRELATION = 0.4', NC)
  );

  // ------------------------------------------------------------
  // 19–21: A run can occur by chance.
  // Introduce the one-lag Ljung–Box test.
  // ------------------------------------------------------------

  const chanceTag = tag(
    'PATTERN OR CHANCE?',
    WC,
    [
      LCX,
      P ? 1.66 : 0.99,
      0
    ],
    19
  );

  await until(S(19));
  await play(
    new M.FadeIn(chanceTag),
    indicate(rLabel, WC),
    ...fbox([
      ['Could this be chance?', WC],
      'A short run alone',
      'does not settle it.',
      'Check the full record.'
    ], WC),
    ...say('A SHORT RUN CAN HAPPEN BY CHANCE', WC)
  );

  const testTitle = txt(
    'LJUNG–BOX TEST',
    P ? 25 : 23,
    GC,
    [LCX, P ? 2.78 : 1.46, 0],
    true
  );

  await until(S(20));
  await play(
    new M.Transform(corrTitle, testTitle),
    ...fbox([
      ['Ljung–Box test', GC],
      'Turn the correlation',
      'into a test score.',
      ['Score: Q', GC]
    ], GC),
    ...say('USE A LJUNG–BOX TEST SCORE', GC)
  );

  const oneLagTag = tag(
    'LAG 1 ONLY',
    GC,
    [
      LCX,
      P ? 1.66 : 0.99,
      0
    ],
    19
  );

  await until(S(21));
  await play(
    new M.Transform(chanceTag, oneLagTag),
    ...fbox([
      ['This example', GC],
      'Check one week back.',
      'One correlation: r = 0.4'
    ], GC),
    ...say('USE THE ONE-LAG VERSION', GC)
  );

  // ------------------------------------------------------------
  // 22–24: Square the correlation.
  //
  // Picture: a square of side 0.4 on a unit square.
  // The area is 0.16.
  // Squaring also maps −0.4 to +0.16.
  // ------------------------------------------------------------

  const QCX = CX;
  const QCY = P ? -0.10 : -0.47;
  const QSIDE = P ? 3.45 : 2.62;

  const QLEFT = QCX - QSIDE / 2;
  const QBOTTOM = QCY - QSIDE / 2;

  const squareParts = [];

  const squareTitle = txt(
    'SQUARE THE CORRELATION',
    P ? 23 : 21,
    GC,
    [QCX, P ? 2.78 : 1.48, 0],
    true
  );

  const unitSquare = rect(
    QSIDE,
    QSIDE,
    [QCX, QCY, 0],
    C.muted,
    0,
    2
  );

  squareParts.push(
    squareTitle,
    unitSquare
  );

  for (let k = 1; k < 10; k++) {
    const xx = QLEFT + k * QSIDE / 10;
    const yy = QBOTTOM + k * QSIDE / 10;

    squareParts.push(
      line(
        [xx, QBOTTOM, 0],
        [xx, QBOTTOM + QSIDE, 0],
        C.muted,
        0.55
      )
    );

    squareParts.push(
      line(
        [QLEFT, yy, 0],
        [QLEFT + QSIDE, yy, 0],
        C.muted,
        0.55
      )
    );
  }

  const unitLabelX = txt(
    '1',
    18,
    C.muted,
    [
      QLEFT + QSIDE,
      QBOTTOM - 0.28,
      0
    ],
    true
  );

  const unitLabelY = txt(
    '1',
    18,
    C.muted,
    [
      QLEFT - 0.25,
      QBOTTOM + QSIDE,
      0
    ],
    true
  );

  squareParts.push(
    unitLabelX,
    unitLabelY
  );

  const side04 = QSIDE * 0.4;

  const square04 = rect(
    side04,
    side04,
    [
      QLEFT + side04 / 2,
      QBOTTOM + side04 / 2,
      0
    ],
    NC,
    0.48,
    2.5
  );

  const sideX = line(
    [QLEFT, QBOTTOM - 0.10, 0],
    [QLEFT + side04, QBOTTOM - 0.10, 0],
    NC,
    3
  );

  const sideY = line(
    [QLEFT - 0.10, QBOTTOM, 0],
    [QLEFT - 0.10, QBOTTOM + side04, 0],
    NC,
    3
  );

  const sideXLabel = txt(
    '0.4',
    20,
    NC,
    [
      QLEFT + side04 / 2,
      QBOTTOM - 0.31,
      0
    ],
    true
  );

  const sideYLabel = txt(
    '0.4',
    20,
    NC,
    [
      QLEFT - 0.38,
      QBOTTOM + side04 / 2,
      0
    ],
    true
  );

  squareParts.push(
    square04,
    sideX,
    sideY,
    sideXLabel,
    sideYLabel
  );

  await until(S(22));
  await play(
    ...fadeOut([
      ...correlationParts,
      rDot,
      rLabel,
      chanceTag
    ]),
    ...fadeIn(squareParts),
    ...fbox([
      ['Step 1: square r', GC],
      'Multiply it by itself.',
      ['0.4 × 0.4', NC]
    ], GC),
    ...say('SQUARE = MULTIPLY A NUMBER BY ITSELF', GC)
  );

  const squareResult = txt(
    '0.16',
    P ? 26 : 24,
    C.ink,
    [
      QLEFT + side04 / 2,
      QBOTTOM + side04 / 2,
      0
    ],
    true,
    side04 - 0.13
  );

  const squareCells = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      squareCells.push(
        rect(
          QSIDE / 10 * 0.90,
          QSIDE / 10 * 0.90,
          [
            QLEFT + (col + 0.5) * QSIDE / 10,
            QBOTTOM + (row + 0.5) * QSIDE / 10,
            0
          ],
          NC,
          0.55,
          1
        )
      );
    }
  }

  await until(S(23));
  await play(
    new M.LaggedStart(
      squareCells.map(r => new M.FadeIn(r)),
      { lagRatio: 0.04, runTime: 1.15 }
    ),
    new M.FadeIn(squareResult),
    ...fbox([
      ['Square the correlation', GC],
      '0.4 × 0.4',
      ['= 0.16', NC]
    ], GC),
    ...say('0.4 × 0.4 = 0.16', NC)
  );

  // A negative correlation also contributes a positive square.
  // Use the hypothetical −0.4 only to explain the operation.

  const SQPAIR_Y = P ? 0.45 : 0.05;

  function squareCard(xx, input, color) {
    const width = P ? 2.75 : 3.0;
    const height = P ? 2.1 : 2.0;

    const r = rounded(
      width,
      height,
      [xx, SQPAIR_Y, 0],
      color
    );

    const inputLabel = txt(
      input,
      27,
      color,
      [xx, SQPAIR_Y + 0.61, 0],
      true
    );

    const op = txt(
      '× itself',
      18,
      C.muted,
      [xx, SQPAIR_Y + 0.12, 0]
    );

    const result = txt(
      '0.16',
      28,
      GC,
      [xx, SQPAIR_Y - 0.58, 0],
      true
    );

    const connector = arrow(
      [xx, SQPAIR_Y - 0.08, 0],
      [xx, SQPAIR_Y - 0.30, 0],
      GC,
      2,
      0.10
    );

    return new M.VGroup(
      r,
      inputLabel,
      op,
      connector,
      result
    );
  }

  const sqPos = squareCard(
    CX - (P ? 1.62 : 1.78),
    '+0.4',
    POS
  );

  const sqNeg = squareCard(
    CX + (P ? 1.62 : 1.78),
    '−0.4',
    NEG
  );

  const sqCompareTitle = txt(
    'BOTH DIRECTIONS COUNT',
    P ? 23 : 21,
    GC,
    [CX, P ? 2.78 : 1.46, 0],
    true
  );

  const hypotheticalNote = txt(
    'Negative value shown for illustration',
    P ? 17 : 16,
    C.muted,
    [CX, P ? -1.25 : -1.42, 0],
    false,
    P ? 6.5 : 6.6
  );

  await until(S(24));
  await play(
    ...fadeOut([
      ...squareParts,
      ...squareCells,
      squareResult
    ]),
    new M.FadeIn(sqCompareTitle),
    new M.FadeIn(sqPos),
    new M.FadeIn(sqNeg),
    new M.FadeIn(hypotheticalNote),
    ...fbox([
      '0.4 × 0.4 = 0.16',
      '(−0.4) × (−0.4)',
      ['= 0.16', GC],
      'Both links count.'
    ], GC),
    ...say('SQUARING COUNTS LINKS IN EITHER DIRECTION', GC)
  );

  // ------------------------------------------------------------
  // 25–30: Build the one-lag Ljung–Box score.
  //
  // Q = n(n + 2) × r² ÷ (n − 1)
  //   = 52 × 54 × 0.16 ÷ 51
  //   ≈ 8.8
  //
  // Use a running visual calculation.
  // ------------------------------------------------------------

  const CCX = CX;
  const CCY = P ? 0.38 : 0.04;

  const CARDW = P ? 1.32 : 1.46;
  const CARDH = P ? 1.36 : 1.24;
  const CSP = P ? 1.76 : 1.86;

  const cx = k => CCX + (k - 1.5) * CSP;

  function factorCard(
    k,
    title,
    value,
    color,
    pending = false
  ) {
    const xx = cx(k);

    const r = rounded(
      CARDW,
      CARDH,
      [xx, CCY, 0],
      pending ? C.muted : color
    );

    r.setFill(
      pending ? C.card : color,
      pending ? 0.97 : 0.16
    );

    const lab = txt(
      title,
      P ? 15 : 15,
      pending ? C.muted : color,
      [xx, CCY + 0.39, 0],
      true,
      CARDW - 0.12
    );

    const number = txt(
      value,
      P ? 25 : 24,
      pending ? C.muted : color,
      [xx, CCY - 0.17, 0],
      true,
      CARDW - 0.14
    );

    return new M.VGroup(
      r,
      lab,
      number
    );
  }

  const calcTitle = txt(
    'BUILD THE TEST SCORE',
    P ? 23 : 21,
    GC,
    [CCX, P ? 2.78 : 1.46, 0],
    true
  );

  const factors = [
    factorCard(0, 'r²', '0.16', NC),
    factorCard(1, 'n', '52', GC),
    factorCard(2, 'n + 2', '?', GC, true),
    factorCard(3, 'n − 1', '?', FC, true)
  ];

  const operators = ['×', '×', '÷'].map((s, k) =>
    txt(
      s,
      27,
      C.ink,
      [
        (cx(k) + cx(k + 1)) / 2,
        CCY,
        0
      ],
      true
    )
  );

  const resultY = P ? -1.37 : -1.46;

  const runningText = txt(
    '0.16 × 52 = 8.32',
    P ? 25 : 23,
    GC,
    [CCX, resultY, 0],
    true,
    P ? 6.6 : 7.0
  );

  const calcParts = [
    calcTitle,
    ...factors,
    ...operators,
    runningText
  ];

  await until(S(25));
  await play(
    ...fadeOut([
      sqCompareTitle,
      sqPos,
      sqNeg,
      hypotheticalNote
    ]),
    new M.FadeIn(calcTitle),
    new M.FadeIn(factors[0]),
    new M.FadeIn(factors[1]),
    new M.FadeIn(factors[2]),
    new M.FadeIn(factors[3]),
    ...fadeIn(operators),
    new M.FadeIn(runningText),
    ...fbox([
      ['Week count: n = 52', GC],
      '0.16 × 52',
      ['= 8.32', GC]
    ], GC),
    ...say('MULTIPLY BY THE 52 WEEKS', GC)
  );

  // Keep references to the live factor objects.
  // The second factor is recreated here as a tracked object
  // by using a fresh full calculation row on the next beat.

  const nCard = factorCard(
    1,
    'n',
    '52',
    GC
  );

  // The live row uses the original pending factor references.
  // For subsequent steps, animate only the third and fourth cards;
  // the visible n = 52 card remains unchanged.

  const nPlusTwoCard = factorCard(
    2,
    'n + 2',
    '54',
    GC
  );

  const running2 = txt(
    '8.32 × 54 = 449.28',
    P ? 25 : 23,
    GC,
    [CCX, resultY, 0],
    true,
    P ? 6.6 : 7.0
  );

  await until(S(26));
  await play(
    new M.FadeOut(factors[2]),
    new M.FadeIn(nPlusTwoCard),
    new M.Transform(
      runningText,
      running2
    ),
    ...fbox([
      'n + 2 = 52 + 2',
      ['= 54', GC],
      '8.32 × 54',
      ['= 449.28', GC]
    ], GC),
    ...say('MULTIPLY AGAIN BY 52 + 2 = 54', GC)
  );
  factors[2] = nPlusTwoCard;

  const pairFactor = factorCard(
    3,
    'n − 1',
    '51',
    FC
  );

  const running3 = txt(
    '449.28 ÷ 51',
    P ? 25 : 23,
    FC,
    [CCX, resultY, 0],
    true
  );

  await until(S(27));
  await play(
    new M.FadeOut(factors[3]),
    new M.FadeIn(pairFactor),
    new M.Transform(
      runningText,
      running3
    ),
    ...fbox([
      ['Neighboring pairs', FC],
      'n − 1 = 51',
      '449.28 ÷ 51'
    ], FC),
    ...say('DIVIDE BY THE 51 NEIGHBORING PAIRS', FC)
  );
  factors[3] = pairFactor;

  const qTag = tag(
    'Q ≈ 8.8',
    GC,
    [
      CCX,
      P ? -2.26 : -2.30,
      0
    ],
    23
  );

  const running4 = txt(
    '449.28 ÷ 51 ≈ 8.8',
    P ? 27 : 25,
    GC,
    [CCX, resultY, 0],
    true,
    P ? 6.6 : 7.0
  );

  await until(S(28));
  await play(
    new M.Transform(
      runningText,
      running4
    ),
    new M.FadeIn(qTag),
    ...fbox([
      ['Ljung–Box score', GC],
      '52 × 54 × 0.16',
      '÷ 51',
      ['Q ≈ 8.8', GC]
    ], GC),
    ...say('OUR TEST SCORE IS ABOUT 8.8', GC)
  );

  const wordTitle = txt(
    'THE ONE-LAG FORMULA',
    P ? 23 : 21,
    GC,
    [CCX, P ? 2.78 : 1.46, 0],
    true
  );

  await until(S(29));
  await play(
    new M.Transform(calcTitle, wordTitle),
    indicate(factors[0], NC),
    indicate(factors[2], GC),
    ...fbox([
      ['Multiply:', GC],
      'squared correlation',
      '× week count',
      '× (week count + 2)',
      ['0.16 × 52 × 54', GC]
    ], GC),
    ...say('SQUARED CORRELATION × COUNT × (COUNT + 2)', GC)
  );

  await until(S(30));
  await play(
    indicate(factors[3], FC),
    ...fbox([
      ['One-lag Ljung–Box', GC],
      'Q = n × (n + 2) × r²',
      '    ÷ (n − 1)',
      ['Q ≈ 8.8', GC]
    ], GC),
    ...say('THEN DIVIDE BY THE WEEK COUNT MINUS ONE', GC)
  );

  // ------------------------------------------------------------
  // 31–33: Compare the test score with the 5% cutoff.
  //
  // For this one-lag example, the reference cutoff is 3.84.
  // A score above it is evidence against no one-week link.
  // ------------------------------------------------------------

  const SCX = CX;
  const SLEFT = SCX - (P ? 3.05 : 3.35);
  const SLEN = P ? 6.10 : 6.70;

  const SY = P ? -0.70 : -0.76;

  const qx = v => SLEFT + v / 10 * SLEN;

  const scoreParts = [];

  const scoreTitle = txt(
    'COMPARE THE TEST SCORE',
    P ? 23 : 21,
    GC,
    [SCX, P ? 2.78 : 1.46, 0],
    true
  );

  const scoreLine = line(
    [qx(0), SY, 0],
    [qx(10), SY, 0],
    C.muted,
    3
  );

  scoreParts.push(
    scoreTitle,
    scoreLine
  );

  const LOW_W = qx(CUTOFF) - qx(0);
  const HIGH_W = qx(10) - qx(CUTOFF);

  const lowRegion = rect(
    LOW_W,
    0.29,
    [
      qx(0) + LOW_W / 2,
      SY,
      0
    ],
    GC,
    0.15,
    1
  );

  const highRegion = rect(
    HIGH_W,
    0.29,
    [
      qx(CUTOFF) + HIGH_W / 2,
      SY,
      0
    ],
    WC,
    0.16,
    1
  );

  scoreParts.push(
    lowRegion,
    highRegion
  );

  for (const v of [0, 2, 4, 6, 8, 10]) {
    scoreParts.push(
      line(
        [qx(v), SY - 0.095, 0],
        [qx(v), SY + 0.095, 0],
        C.muted,
        1.5
      )
    );

    scoreParts.push(
      txt(
        v,
        P ? 15 : 16,
        C.muted,
        [qx(v), SY - 0.31, 0],
        true
      )
    );
  }

  const scoreAxisLabel = txt(
    'Ljung–Box score Q',
    17,
    C.muted,
    [SCX, SY - 0.77, 0]
  );

  scoreParts.push(scoreAxisLabel);

  const cutoffLine = dashed(
    [qx(CUTOFF), SY - 0.15, 0],
    [qx(CUTOFF), SY + 1.43, 0],
    WC
  );

  const cutoffValue = txt(
    '3.84',
    25,
    WC,
    [
      qx(CUTOFF),
      SY + 1.59,
      0
    ],
    true
  );

  const cutoffTag = tag(
    '5% CUTOFF',
    WC,
    P ? [qx(CUTOFF), SY + 2.00, 0] : [qx(CUTOFF) - 1.15, SY + 1.59, 0],
    P ? 16 : 16,
    P ? 2.5 : 2.6
  );

  const cutoffParts = [
    cutoffLine,
    cutoffValue,
    cutoffTag
  ];

  // Retain a reference to every object used in the score scene.

  await until(S(31));
  await play(
    ...fadeOut([calcTitle, ...factors, ...operators, runningText]),
    new M.FadeOut(qTag),
    ...fadeIn(scoreParts),
    new M.Create(cutoffLine),
    new M.FadeIn(cutoffValue),
    new M.FadeIn(cutoffTag),
    ...fbox([
      ['5% reference cutoff', WC],
      'One lag in this example',
      ['Q cutoff ≈ 3.84', WC]
    ], WC),
    ...say('THE 5% CUTOFF IS ABOUT 3.84', WC)
  );

  const uncommonLabel = txt(
    'Uncommon under no link',
    P ? 17 : 16,
    WC,
    [
      (qx(CUTOFF) + qx(10)) / 2,
      SY + 0.57,
      0
    ],
    false,
    HIGH_W - 0.15
  );

  const belowLabel = txt(
    'Below cutoff',
    P ? 16 : 16,
    C.muted,
    [
      (qx(0) + qx(CUTOFF)) / 2,
      SY + 0.57,
      0
    ],
    false,
    LOW_W - 0.15
  );

  const tailArrow = arrow(
    [qx(CUTOFF) + 0.13, SY + 0.25, 0],
    [qx(10) - 0.10, SY + 0.25, 0],
    WC,
    2.5,
    0.14
  );

  await until(S(32));
  await play(
    new M.FadeIn(uncommonLabel),
    new M.FadeIn(belowLabel),
    new M.FadeIn(tailArrow),
    ...fbox([
      'If there is no',
      'one-week link,',
      'a score this high',
      ['is uncommon.', WC]
    ], WC),
    ...say('HIGH SCORES ARE UNCOMMON IF THERE IS NO LINK', WC)
  );

  const scoreDot = glowDot(
    [qx(Q1), SY, 0],
    WC,
    0.12
  );

  const scoreValue = txt(
    '8.8',
    29,
    WC,
    [
      qx(Q1),
      SY - 1.23,
      0
    ],
    true
  );

  const scoreStem = line(
    [qx(Q1), SY - 0.11, 0],
    [qx(Q1), SY - 0.98, 0],
    WC,
    2
  );

  const evidenceTag = tag(
    'EVIDENCE OF A LINK',
    WC,
    P ? [SCX, 2.05, 0] : [qx(7.2), SY + 1.59, 0],
    P ? 18 : 17
  );

  await until(S(33));
  await play(
    new M.FadeIn(scoreDot),
    new M.Create(scoreStem),
    new M.FadeIn(scoreValue),
    new M.FadeIn(evidenceTag),
    ...fbox([
      ['Observed score: 8.8', WC],
      'Reference cutoff: 3.84',
      ['8.8 > 3.84', WC],
      'Evidence of a one-week link.'
    ], WC),
    ...say('8.8 CLEARS THE CUTOFF: EVIDENCE OF A LINK', WC)
  );

  // ------------------------------------------------------------
  // 34–37: An improved forecast rule.
  //
  // Lag-one correlation = 0.1.
  // Squared correlation = 0.01.
  // Q = 52 × 54 × 0.01 ÷ 51 ≈ 0.55.
  //
  // The same record length and cutoff are used.
  // ------------------------------------------------------------

  const improvedTitle = txt(
    'TRY AN IMPROVED FORECAST RULE',
    P ? 22 : 20,
    GC,
    [SCX, P ? 2.78 : 1.46, 0],
    true,
    P ? FW - 1.1 : 7.1
  );

  const oldScoreLabel = tag(
    'OLD RULE',
    WC,
    [
      qx(Q1),
      SY + 0.92,
      0
    ],
    15,
    1.65
  );

  const improvedTag = tag(
    'NEW RULE: CHECK AGAIN',
    GC,
    P ? [SCX, 2.05, 0] : [qx(7.2), SY + 1.59, 0],
    17
  );

  await until(S(34));
  await play(
    new M.Transform(scoreTitle, improvedTitle),
    new M.Transform(evidenceTag, improvedTag),
    new M.FadeIn(oldScoreLabel),
    new M.FadeOut(uncommonLabel),
    new M.FadeOut(belowLabel),
    new M.FadeOut(tailArrow),
    ...fbox([
      ['Improved forecast rule', GC],
      'Check its signed gaps.',
      'Use the same',
      '52-week record.'
    ], GC),
    ...say('IMPROVE THE RULE, THEN TEST AGAIN', GC)
  );

  // Compact visual comparison of the old and new correlations.

  const COMPY = P ? -2.76 : -2.41;

  const oldCorrelationTag = tag(
    'OLD r = 0.4',
    WC,
    [
      SCX - (P ? 1.55 : 1.75),
      COMPY,
      0
    ],
    17,
    P ? 2.9 : 3.1
  );

  const newCorrelationTag = tag(
    'NEW r = 0.1',
    GC,
    [
      SCX + (P ? 1.55 : 1.75),
      COMPY,
      0
    ],
    17,
    P ? 2.9 : 3.1
  );

  await until(S(35));
  await play(
    new M.FadeIn(oldCorrelationTag),
    new M.FadeIn(newCorrelationTag),
    ...fbox([
      ['New lag-one r = 0.1', GC],
      'Square the correlation:',
      '0.1 × 0.1',
      ['= 0.01', GC]
    ], GC),
    ...say('NEW CORRELATION: 0.1, SQUARED: 0.01', GC)
  );

  const improvedDot = glowDot(
    [qx(Q2), SY, 0],
    GC,
    0.115
  );

  const improvedValue = txt(
    '0.55',
    27,
    GC,
    [
      qx(Q2) + 0.17,
      SY - 1.23,
      0
    ],
    true
  );

  const improvedStem = line(
    [qx(Q2), SY - 0.10, 0],
    [
      qx(Q2) + 0.17,
      SY - 0.98,
      0
    ],
    GC,
    2
  );

  const newScoreLabel = tag(
    'NEW RULE',
    GC,
    [
      qx(Q2) + 0.23,
      SY + 0.92,
      0
    ],
    15,
    1.65
  );

  await until(S(36));
  await play(
    new M.FadeIn(improvedDot),
    new M.Create(improvedStem),
    new M.FadeIn(improvedValue),
    new M.FadeIn(newScoreLabel),
    ...fbox([
      ['Same test calculation', GC],
      '52 × 54 × 0.01',
      '÷ 51',
      ['Q ≈ 0.55', GC]
    ], GC),
    ...say('THE IMPROVED RULE SCORES ABOUT 0.55', GC)
  );

  const littleEvidenceTag = tag(
    'LITTLE EVIDENCE OF A LINK',
    GC,
    [
      SCX,
      P ? 2.05 : 0.88,
      0
    ],
    P ? 17 : 16,
    P ? 6.7 : 6.7
  );

  await until(S(37));
  await play(
    new M.Transform(
      evidenceTag,
      littleEvidenceTag
    ),
    indicate(improvedDot, GC),
    ...fbox([
      ['New score: 0.55', GC],
      'Reference cutoff: 3.84',
      ['0.55 < 3.84', GC],
      'Little evidence of',
      'a one-week link.'
    ], GC),
    ...say('BELOW CUTOFF: LITTLE EVIDENCE OF A LINK', GC)
  );

  // ------------------------------------------------------------
  // 38: The fuller Ljung–Box test can combine autocorrelations
  // from several lags.
  //
  // The additional lag values are not supplied.
  // Show the distances without inventing correlations.
  // ------------------------------------------------------------

  const scoreLiveParts = [
    ...scoreParts,
    ...cutoffParts,
    scoreDot,
    scoreValue,
    scoreStem,
    evidenceTag,
    oldScoreLabel,
    oldCorrelationTag,
    newCorrelationTag,
    improvedDot,
    improvedValue,
    improvedStem,
    newScoreLabel
  ];

  const MLX = CX;
  const MLSP = P ? 0.90 : 1.05;

  const mlx = k => MLX + (k - 3) * MLSP;

  const MLY = P ? -0.45 : -1.05;

  const multiLagParts = [];

  const multiLagTitle = txt(
    'CHECK SEVERAL DISTANCES BACK',
    P ? 22 : 20,
    GC,
    [MLX, P ? 2.78 : 1.47, 0],
    true
  );

  multiLagParts.push(multiLagTitle);

  const lagWeeks = [];

  for (let k = 0; k < 7; k++) {
    const xx = mlx(k);

    const color = k === 6 ? NC : C.muted;

    const r = rounded(
      MLSP * 0.73,
      P ? 0.65 : 0.57,
      [xx, MLY, 0],
      color
    );

    r.setFill(color, k === 6 ? 0.25 : 0.10);

    const dot = glowDot(
      [xx, MLY, 0],
      color,
      0.075
    );

    const label = txt(
      k === 6 ? 'NOW' : `−${6 - k}`,
      P ? 14 : 15,
      color,
      [xx, MLY - 0.48, 0],
      true,
      MLSP - 0.10
    );

    lagWeeks.push(
      new M.VGroup(r, dot, label)
    );
  }

  function lagArrow(lag, color, lane) {
    const target = [
      mlx(6),
      MLY + 0.38,
      0
    ];

    const destination = [
      mlx(6 - lag),
      MLY + 0.38,
      0
    ];

    const a = [
      target[0],
      lane,
      0
    ];

    const b = [
      destination[0],
      lane,
      0
    ];

    const label = txt(
      `LAG ${lag}`,
      P ? 15 : 15,
      color,
      [
        (a[0] + b[0]) / 2,
        lane + 0.20,
        0
      ],
      true
    );

    return new M.VGroup(
      line(target, a, color, 1.6),
      line(a, b, color, 2.5),
      arrow(
        b,
        destination,
        color,
        2,
        0.12
      ),
      label
    );
  }

  const multiArrows = [
    lagArrow(
      1,
      NC,
      P ? 0.32 : -0.20
    ),
    lagArrow(
      2,
      NEG,
      P ? 1.02 : 0.36
    ),
    lagArrow(
      3,
      FC,
      P ? 1.72 : 0.92
    )
  ];

  const multiLagNote = txt(
    'Earlier residuals at different lags',
    P ? 17 : 17,
    C.muted,
    [
      MLX,
      P ? -1.67 : -2.22,
      0
    ]
  );

  multiLagParts.push(
    ...lagWeeks,
    ...multiArrows,
    multiLagNote
  );

  await until(S(38));
  await play(
    ...fadeOut(scoreLiveParts),
    new M.FadeIn(multiLagTitle),
    ...fadeIn(lagWeeks),
    new M.LaggedStart(
      multiArrows.map(a => new M.FadeIn(a)),
      { lagRatio: 0.35, runTime: 1.8 }
    ),
    new M.FadeIn(multiLagNote),
    ...fbox([
      ['Fuller Ljung–Box test', GC],
      'Combine links at',
      'several lags.',
      'Lag 1, lag 2, lag 3, ...'
    ], GC),
    ...say('A FULLER TEST CAN COMBINE SEVERAL LAGS', GC)
  );

  // ------------------------------------------------------------
  // 39: Use the result to decide whether to look for
  // a remaining timing pattern.
  // ------------------------------------------------------------

  const useTitle = txt(
    'LOOK FOR LEFTOVER TIMING PATTERNS',
    P ? 21 : 19,
    GC,
    [MLX, P ? 2.78 : 1.47, 0],
    true,
    P ? FW - 1.1 : 7.1
  );

  await until(S(39));
  await play(
    new M.Transform(multiLagTitle, useTitle),
    new M.LaggedStart(
      multiArrows.map(a =>
        new M.Indicate(a, { color: GC })
      ),
      { lagRatio: 0.25, runTime: 1.6 }
    ),
    ...fbox([
      ['Why check?', GC],
      'A leftover timing link',
      'may point to a pattern',
      'the rule could use.',
      'Investigate, then retest.'
    ], GC),
    ...say('LOOK FOR TIMING INFORMATION THE RULE MISSED', GC)
  );

  // ------------------------------------------------------------
  // 40–41: Trap.
  //
  // A low autocorrelation test score does not establish
  // that forecast misses are small.
  //
  // Show a clearly labeled hypothetical series with large
  // misses and a weak lag-one relationship.
  //
  // These are not North's actual residuals.
  // ------------------------------------------------------------

  const ILLUSTRATION = [
    8, 8, -8, -8,
    8, 8, -8, -8,
    8
  ];

  const TCX = CX;
  const TSP = P ? 0.73 : 0.80;
  const TY = P ? -0.30 : -0.40;
  const TU = P ? 0.245 : 0.17;

  const tx = k => TCX + (k - 4) * TSP;
  const ty = v => TY + v * TU;

  const trapParts = [];

  const trapTitle = txt(
    'A LOW SCORE IS NOT PROOF',
    P ? 22 : 20,
    WC,
    [TCX, P ? 2.78 : 1.46, 0],
    true
  );

  const trapSubtitle = txt(
    'Hypothetical residuals',
    P ? 18 : 17,
    C.muted,
    [TCX, P ? 2.27 : 1.02, 0]
  );

  trapParts.push(
    trapTitle,
    trapSubtitle
  );

  const trapLeft = tx(0) - TSP / 2;
  const trapRight = tx(8) + TSP / 2;

  for (const v of [-8, -4, 0, 4, 8]) {
    trapParts.push(
      line(
        [trapLeft, ty(v), 0],
        [trapRight, ty(v), 0],
        v === 0 ? C.ink : C.muted,
        v === 0 ? 2.5 : 0.65
      )
    );

    trapParts.push(
      txt(
        signed(v),
        P ? 15 : 16,
        v === 0 ? C.ink : C.muted,
        [
          trapLeft - 0.26,
          ty(v),
          0
        ],
        true
      )
    );
  }

  const trapStems = [];
  const trapDots = [];
  const trapLabels = [];

  ILLUSTRATION.forEach((v, k) => {
    trapStems.push(
      line(
        [tx(k), TY, 0],
        [tx(k), ty(v), 0],
        signColor(v),
        3.0
      )
    );

    trapDots.push(
      glowDot(
        [tx(k), ty(v), 0],
        signColor(v),
        0.077
      )
    );

    trapLabels.push(
      txt(
        k + 1,
        P ? 14 : 15,
        C.muted,
        [
          tx(k),
          ty(-8) - 0.34,
          0
        ],
        true
      )
    );
  });

  const lowLinkTag = tag(
    'LAG-ONE PAIR CORRELATION = 0',
    GC,
    [
      TCX,
      P ? -3.04 : -2.57,
      0
    ],
    P ? 16 : 16,
    P ? 6.6 : 7.0
  );

  // In this illustrative sequence, the eight neighboring
  // pairs contain two of each sign combination:
  // (++), (+−), (−−), (−+).
  // Their paired correlation is exactly zero.
  // Every absolute miss is nevertheless eight cases.

  await until(S(40));
  await play(
    ...fadeOut(multiLagParts),
    ...fadeIn(trapParts),
    ...fadeIn(trapLabels),
    new M.LaggedStart(
      trapStems.map(s => new M.Create(s)),
      { lagRatio: 0.06, runTime: 1.25 }
    ),
    ...fadeIn(trapDots),
    new M.FadeIn(lowLinkTag),
    ...fbox([
      ['Trap', WC],
      'Little one-week link',
      'does not mean',
      ['small forecast errors.', WC]
    ], WC),
    ...say('A LOW TEST SCORE DOES NOT PROVE GOOD FORECASTS', WC)
  );

  const bigMissLabels = ILLUSTRATION.map((v, k) =>
    txt(
      signed(v),
      P ? 16 : 17,
      signColor(v),
      [
        tx(k),
        ty(v) + (v > 0 ? 0.23 : -0.23),
        0
      ],
      true,
      TSP - 0.09
    )
  );

  await until(S(41));
  await play(
    ...fadeIn(bigMissLabels),
    new M.LaggedStart(
      trapDots.map(d =>
        new M.Indicate(d, { color: WC })
      ),
      { lagRatio: 0.06, runTime: 1.25 }
    ),
    ...fbox([
      ['Hypothetical example', WC],
      'Every miss = 8 cases',
      'Average miss = 8',
      ['Lag-one correlation = 0', GC],
      'Check accuracy separately.'
    ], WC),
    ...say('BIG MISSES CAN HAVE LITTLE ONE-WEEK LINK', WC)
  );

  // ------------------------------------------------------------
  // 42: Recap.
  //
  // Residual = actual − forecast.
  // Pair neighboring residuals.
  // Check their one-week link.
  // Compare the test score with its reference cutoff.
  //
  // Original North example:
  // r = 0.4, Q ≈ 8.8: evidence of a link.
  // Improved rule:
  // r = 0.1, Q ≈ 0.55: little evidence of a link.
  // ------------------------------------------------------------

  const FCX = CX;
  const FB = P ? -1.75 : -1.75;

  const FSP = P ? 2.65 : 3.05;
  const FBW = P ? 1.35 : 1.52;

  const FU = P ? 0.43 : 0.265;

  const fx1 = FCX - FSP / 2;
  const fx2 = FCX + FSP / 2;

  const recapTitle = txt(
    'RESIDUAL AUTOCORRELATION',
    P ? 23 : 21,
    GC,
    [FCX, P ? 2.78 : 1.46, 0],
    true
  );

  const recapFloor = line(
    [
      fx1 - FBW / 2 - 0.50,
      FB,
      0
    ],
    [
      fx2 + FBW / 2 + 0.50,
      FB,
      0
    ],
    C.muted,
    2
  );

  function recapBar(xx, q, color) {
    const h = q * FU;

    return rect(
      FBW,
      h,
      [
        xx,
        FB + h / 2,
        0
      ],
      color,
      0.67,
      2
    );
  }

  const oldBar = recapBar(
    fx1,
    Q1,
    WC
  );

  const newBar = recapBar(
    fx2,
    Q2,
    GC
  );

  const oldBarValue = txt(
    '8.8',
    27,
    WC,
    [
      fx1,
      FB + Q1 * FU + 0.26,
      0
    ],
    true
  );

  const newBarValue = txt(
    '0.55',
    27,
    GC,
    [
      fx2,
      FB + Q2 * FU + 0.27,
      0
    ],
    true
  );

  const finalCutoff = dashed(
    [
      fx1 - FBW / 2 - 0.45,
      FB + CUTOFF * FU,
      0
    ],
    [
      fx2 + FBW / 2 + 0.45,
      FB + CUTOFF * FU,
      0
    ],
    WC
  );

  const finalCutoffTag = tag(
    'CUTOFF 3.84',
    WC,
    [
      fx2 + 0.10,
      FB + CUTOFF * FU + 0.30,
      0
    ],
    15,
    2.10
  );

  const finalOldLabel = txt(
    'ORIGINAL',
    18,
    WC,
    [fx1, FB - 0.34, 0],
    true
  );

  const finalNewLabel = txt(
    'IMPROVED',
    18,
    GC,
    [fx2, FB - 0.34, 0],
    true
  );

  const finalOldR = txt(
    'r = 0.4',
    17,
    WC,
    [fx1, FB - 0.74, 0],
    true
  );

  const finalNewR = txt(
    'r = 0.1',
    17,
    GC,
    [fx2, FB - 0.74, 0],
    true
  );

  await until(S(42));
  await play(
    ...fadeOut([
      ...trapParts,
      ...trapStems,
      ...trapDots,
      ...trapLabels,
      ...bigMissLabels,
      lowLinkTag
    ]),
    new M.FadeIn(recapTitle),
    new M.Create(recapFloor),
    new M.FadeIn(oldBar),
    new M.FadeIn(newBar),
    new M.Create(finalCutoff),
    new M.FadeIn(finalCutoffTag),
    new M.FadeIn(oldBarValue),
    new M.FadeIn(newBarValue),
    ...fadeIn([
      finalOldLabel,
      finalNewLabel,
      finalOldR,
      finalNewR
    ]),
    ...fbox([
      ['Residual autocorrelation', GC],
      '1. Actual − forecast',
      '2. Pair neighboring gaps',
      '3. Check the timing link',
      ['4. Investigate patterns', GC],
      'Check miss sizes too.'
    ], GC),
    ...say('CHECK WHETHER SIGNED GAPS ARE LINKED OVER TIME', GC)
  );

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          oldBar,
          { color: WC }
        ),
        new M.Indicate(
          finalCutoff,
          { color: WC }
        ),
        new M.Indicate(
          newBar,
          { color: GC }
        )
      ],
      {
        lagRatio: 0.40,
        runTime: Math.min(
          2.8,
          Math.max(
            1.2,
            E(42) - S(42) - 1.6
          )
        )
      }
    )
  );
}
