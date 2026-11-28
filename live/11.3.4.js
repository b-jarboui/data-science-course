// lesson 11.3.4
// Prediction bands.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Fixed shared chapter data.
  const START_WEEK = 12;
  const START_VALUE = 52;
  const STEP = 2;
  const HORIZON = 4;

  const LEVELS = [
    [52],
    [50, 54],
    [48, 52, 56],
    [46, 50, 54, 58],
    [44, 48, 52, 56, 60]
  ];

  const PATH_COUNTS = [1, 2, 4, 8, 16];

  const ENDINGS = [44, 48, 52, 56, 60];
  const ENDING_COUNTS = [1, 4, 6, 4, 1];

  const BAND_LOW = 48;
  const BAND_HIGH = 56;
  const BAND_COUNT = 14;

  const NC = C.cyan;
  const FC = C.amber;
  const PC = C.violet;
  const BC = C.green;

  // Responsive layout.
  // Phone: 8 × 14.22, content between y=-5.5 and y=4.3.
  // Laptop: 14.22 × 8, content between y=-3.0 and y=2.3.

  const CX = P ? -0.70 : -2.65;
  const PILL = P ? [0, 3.72, 0] : [0, 1.97, 0];
  const BOXP = P ? [0, -5.6, 0] : [4.35, -0.35, 0];

  const X0 = P ? -3.05 : -5.75;
  const SP = P ? 1.10 : 1.40;
  const CY = P ? -0.55 : -0.40;
  const UNIT = P ? 0.34 : 0.18;
  // spot for small tags that must not sit on the paths
  const TAGP = P ? [-0.85, 2.62, 0] : [-2.65, -3.2, 0];

  const x = k => X0 + k * SP;
  const y = v => CY + (v - START_VALUE) * UNIT;
  const pt = (k, v) => [x(k), y(v), 0];

  const LEFT = x(0) - 0.22;
  const RIGHT = x(4) + 0.25;
  const BOTTOM = y(44) - 0.27;
  const TOP = y(60) + 0.22;

  const COUNTX = x(4) + (P ? 1.92 : 1.66);

  const say = (s, c = NC) => showA(s, c, PILL);

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

  function arrow(a, b, color = C.amber, strokeWidth = 2.5) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / len;
    const uy = dy / len;

    const h = 0.15;
    const wing = 0.075;

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(
        b,
        [
          b[0] - h * ux + wing * uy,
          b[1] - h * uy - wing * ux,
          0
        ],
        color,
        strokeWidth
      ),
      line(
        b,
        [
          b[0] - h * ux - wing * uy,
          b[1] - h * uy + wing * ux,
          0
        ],
        color,
        strokeWidth
      )
    );
  }

  function glowDot(p, color, radius = 0.075) {
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

  function ring(p, radius, color, strokeWidth = 2.5) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  // Formula box: follows the approved reference lesson.

  let boxNow = null;

  function fbox(lines, color = NC, position = BOXP) {
    const size = P ? 22 : 21;
    const lh = P ? 0.43 : 0.42;

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

    const maxw = P ? FW - 1.2 : 4.25;

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
  // 0–1: North must order bottled water several weeks ahead.
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

    crate.setFill(NC, 0.23);

    parts.push(crate);

    return new M.VGroup(...parts);
  }

  const INTRO_Y = P ? 0.60 : -0.05;

  const cases = [-1.75, 0, 1.75].map(
    xx => waterCase(xx, INTRO_Y)
  );

  const northTag = pill(
    'NORTH',
    NC,
    23
  );

  northTag.moveTo([
    0,
    INTRO_Y + 1.30,
    0
  ]);

  const introWeeks = [];

  const INTRO_SP = P ? 1.48 : 1.85;
  const INTRO_W = P ? 1.25 : 1.55;
  const INTRO_CARD_Y = P ? -1.80 : -1.48;

  for (let k = 0; k < HORIZON; k++) {
    const xx = (k - 1.5) * INTRO_SP;

    const r = rounded(
      INTRO_W,
      1.00,
      [xx, INTRO_CARD_Y, 0],
      FC
    );

    const lab = txt(
      `WEEK ${13 + k}`,
      P ? 15 : 17,
      C.muted,
      [xx, INTRO_CARD_Y + 0.26, 0],
      true,
      INTRO_W - 0.10
    );

    const q = txt(
      '?',
      28,
      FC,
      [xx, INTRO_CARD_Y - 0.17, 0],
      true
    );

    introWeeks.push(
      new M.VGroup(r, lab, q)
    );
  }

  await until(S(0));
  await play(
    new M.FadeIn(northTag),
    new M.LaggedStart(
      cases.map(c => new M.FadeIn(c)),
      { lagRatio: 0.16, runTime: 1.15 }
    ),
    ...say('ORDERING WATER SEVERAL WEEKS AHEAD')
  );

  await until(S(1));
  await play(
    new M.LaggedStart(
      introWeeks.map(c => new M.FadeIn(c)),
      { lagRatio: 0.13, runTime: 1.25 }
    ),
    ...say('HOW FAR COULD DEMAND WANDER?', FC)
  );

  // ------------------------------------------------------------
  // 2–3: Start from North's latest actual demand, 52 cases.
  // The naive forecast stays at 52 across weeks 13–16.
  // ------------------------------------------------------------

  const chartParts = [];

  const chartTitle = txt(
    'NORTH: CASES WANTED',
    P ? 23 : 21,
    NC,
    [CX, P ? 3.1 : 1.48, 0],
    true,
    P ? FW - 1.2 : 6.6
  );

  chartParts.push(chartTitle);

  const floor = line(
    [LEFT, BOTTOM, 0],
    [RIGHT, BOTTOM, 0],
    C.muted,
    2
  );

  chartParts.push(floor);

  for (let k = 0; k <= HORIZON; k++) {
    const guide = line(
      [x(k), BOTTOM, 0],
      [x(k), TOP, 0],
      C.muted,
      0.65
    );

    const tick = line(
      [x(k), BOTTOM - 0.05, 0],
      [x(k), BOTTOM + 0.05, 0],
      C.muted,
      1.5
    );

    const label = txt(
      START_WEEK + k,
      P ? 17 : 17,
      k === 0 ? NC : C.muted,
      [x(k), BOTTOM - 0.23, 0],
      true,
      SP * 0.84
    );

    chartParts.push(guide, tick, label);
  }

  for (const v of [44, 48, 52, 56, 60]) {
    const guide = line(
      [LEFT, y(v), 0],
      [RIGHT, y(v), 0],
      C.muted,
      0.7
    );

    const label = txt(
      v,
      P ? 17 : 16,
      C.muted,
      [
        LEFT - (P ? 0.27 : 0.31),
        y(v),
        0
      ],
      true
    );

    chartParts.push(guide, label);
  }

  const weekLabel = txt(
    'Week',
    16,
    C.muted,
    [(x(0) + x(4)) / 2, BOTTOM - 0.56, 0]
  );

  chartParts.push(weekLabel);

  const startDot = glowDot(
    pt(0, START_VALUE),
    NC,
    P ? 0.10 : 0.095
  );

  const startLabel = txt(
    '52',
    23,
    NC,
    [x(0), y(52) + 0.35, 0],
    true
  );

  const latestTag = pill(
    'LATEST ACTUAL',
    NC,
    P ? 15 : 15
  );

  latestTag.moveTo([
    x(0) + (P ? 0.58 : 0.65),
    y(52) - (P ? 0.70 : 0.57),
    0
  ]);

  await until(S(2));
  await play(
    ...fadeOut([
      ...cases,
      northTag,
      ...introWeeks
    ]),
    ...fadeIn(chartParts),
    new M.FadeIn(startDot),
    new M.FadeIn(startLabel),
    new M.FadeIn(latestTag),
    ...say('WEEK 12: 52 CASES', NC)
  );

  const forecastLine = dashed(
    pt(0, 52),
    pt(4, 52),
    FC
  );

  const forecastDots = [];

  for (let k = 1; k <= HORIZON; k++) {
    forecastDots.push(
      ring(
        pt(k, 52),
        P ? 0.115 : 0.105,
        FC,
        2.5
      )
    );
  }

  const forecastTag = pill(
    'NAIVE FORECAST: 52',
    FC,
    P ? 16 : 17
  );

  forecastTag.moveTo([
    (x(1) + x(4)) / 2,
    y(52) - (P ? 0.54 : 0.47),
    0
  ]);

  await until(S(3));
  await play(
    new M.FadeOut(latestTag),
    new M.Create(forecastLine),
    new M.LaggedStart(
      forecastDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.13, runTime: 1.15 }
    ),
    new M.FadeIn(forecastTag),
    ...say('BEST GUESS: 52 EACH WEEK', FC)
  );

  // ------------------------------------------------------------
  // 4–9: Introduce the week-by-week surprise.
  // A fair coin gives two equally likely moves: +2 or −2.
  // ------------------------------------------------------------

  const UP = C.green;
  const DOWN = C.violet;

  await until(S(4));
  await play(
    ...fbox([
      'Each new week:',
      ['up 2 cases', UP],
      ['or down 2 cases', DOWN]
    ], PC),
    ...say('DEMAND CAN MOVE UP OR DOWN BY 2', PC)
  );

  const COIN_X = BOXP[0];
  const COIN_Y = BOXP[1];

  const COIN_SP = P ? 2.65 : 1.95;
  const COIN_R = P ? 0.37 : 0.33;

  const coinPanel = rounded(
    P ? 6.25 : 4.15,
    P ? 2.05 : 2.02,
    BOXP,
    FC
  );

  const coinHeading = txt(
    'FAIR COIN',
    P ? 20 : 19,
    FC,
    [COIN_X, COIN_Y + 0.76, 0],
    true
  );

  function coinFace(xx, face, name) {
    const body = new M.Circle({
      radius: COIN_R,
      color: FC,
      strokeWidth: 3
    });

    body.setFill(FC, 0.22);
    body.moveTo([xx, COIN_Y + 0.11, 0]);

    const inner = ring(
      [xx, COIN_Y + 0.11, 0],
      COIN_R * 0.80,
      FC,
      1
    );

    const letter = txt(
      face,
      25,
      FC,
      [xx, COIN_Y + 0.11, 0],
      true
    );

    const label = txt(
      name,
      P ? 18 : 17,
      C.ink,
      [xx, COIN_Y - 0.44, 0],
      true
    );

    return new M.VGroup(
      body,
      inner,
      letter,
      label
    );
  }

  const headX = COIN_X - COIN_SP / 2;
  const tailX = COIN_X + COIN_SP / 2;

  const heads = coinFace(
    headX,
    'H',
    'HEADS'
  );

  const tails = coinFace(
    tailX,
    'T',
    'TAILS'
  );

  const coinParts = [
    coinPanel,
    coinHeading,
    heads,
    tails
  ];

  await until(S(5));
  await play(
    ...clearBox(),
    ...fadeIn(coinParts),
    ...say('A FAIR COIN CHOOSES THE MOVE', FC)
  );

  const headResult = txt(
    '+2 CASES',
    P ? 19 : 18,
    UP,
    [headX, COIN_Y - 0.76, 0],
    true
  );

  const tailResult = txt(
    '−2 CASES',
    P ? 19 : 18,
    DOWN,
    [tailX, COIN_Y - 0.76, 0],
    true
  );

  await until(S(6));
  await play(
    new M.Indicate(heads, { color: UP }),
    new M.FadeIn(headResult),
    ...say('HEADS: ADD 2 TO THE LAST DOT', UP)
  );

  await until(S(7));
  await play(
    new M.Indicate(tails, { color: DOWN }),
    new M.FadeIn(tailResult),
    ...say('TAILS: TAKE AWAY 2', DOWN)
  );

  await until(S(8));
  await play(
    new M.Indicate(heads, { color: FC }),
    new M.Indicate(tails, { color: FC }),
    ...say('EVERY WEEK GETS A FRESH FLIP', FC)
  );

  await until(S(9));
  await play(
    ...fadeOut([
      ...coinParts,
      headResult,
      tailResult
    ]),
    ...fbox([
      ['innovation', PC],
      'an unexpected move',
      ['this example: +2 or −2', PC]
    ], PC),
    ...say('INNOVATION = AN UNEXPECTED MOVE', PC)
  );

  // ------------------------------------------------------------
  // 10: Show what a path means before building the full fan.
  // A path follows one particular sequence of coin flips.
  // ------------------------------------------------------------

  const DEMO_X = BOXP[0];
  const DEMO_Y = BOXP[1];

  const demoPanel = rounded(
    P ? 6.25 : 4.15,
    P ? 2.05 : 2.02,
    BOXP,
    PC
  );

  const demoTitle = txt(
    'ONE POSSIBLE PATH',
    P ? 20 : 19,
    PC,
    [DEMO_X, DEMO_Y + 0.76, 0],
    true
  );

  const DSP = P ? 1.42 : 1.08;

  const demoPoints = [
    [DEMO_X - DSP, DEMO_Y - 0.20, 0],
    [DEMO_X, DEMO_Y + 0.30, 0],
    [DEMO_X + DSP, DEMO_Y - 0.20, 0]
  ];

  const demoEdges = [
    arrow(
      demoPoints[0],
      demoPoints[1],
      UP
    ),
    arrow(
      demoPoints[1],
      demoPoints[2],
      DOWN
    )
  ];

  const demoDots = demoPoints.map(
    p => glowDot(p, NC, 0.075)
  );

  const demoHead = txt(
    'H',
    18,
    UP,
    [
      (demoPoints[0][0] + demoPoints[1][0]) / 2,
      DEMO_Y + 0.30,
      0
    ],
    true
  );

  const demoTail = txt(
    'T',
    18,
    DOWN,
    [
      (demoPoints[1][0] + demoPoints[2][0]) / 2,
      DEMO_Y + 0.30,
      0
    ],
    true
  );

  const demoNote = txt(
    'A sequence of flips',
    17,
    C.muted,
    [DEMO_X, DEMO_Y - 0.71, 0]
  );

  const demoParts = [
    demoPanel,
    demoTitle,
    ...demoEdges,
    ...demoDots,
    demoHead,
    demoTail,
    demoNote
  ];

  await until(S(10));
  await play(
    ...clearBox(),
    ...fadeIn(demoParts),
    ...say('PATH = THE TRAIL OF ONE SEQUENCE', PC)
  );

  // ------------------------------------------------------------
  // 11–18: Build the branching fan.
  //
  // Distinct paths can reach the same demand value.
  // Shared branches occupy the same coordinates.
  // The counts refer to complete flip sequences, not just
  // the number of distinct visible dots.
  // ------------------------------------------------------------

  const fanEdges = [];
  const fanNodes = [];
  const edgeLevels = [];
  const nodeLevels = [];

  function branch(k, from, to, color = NC, width = 2) {
    const a = pt(k - 1, from);
    const b = pt(k, to);

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / len;
    const uy = dy / len;

    const inset = P ? 0.075 : 0.072;

    return line(
      [
        a[0] + inset * ux,
        a[1] + inset * uy,
        0
      ],
      [
        b[0] - inset * ux,
        b[1] - inset * uy,
        0
      ],
      color,
      width
    );
  }

  function possibleDot(k, value) {
    return glowDot(
      pt(k, value),
      NC,
      P ? 0.065 : 0.062
    );
  }

  function valueLabel(k, value, color = NC, side = 1) {
    return txt(
      value,
      P ? 16 : 17,
      color,
      [
        x(k) + 0.03,
        y(value) + side * (P ? 0.24 : 0.20),
        0
      ],
      true,
      SP * 0.80
    );
  }

  const up13 = branch(
    1,
    52,
    54,
    NC,
    2.5
  );

  const down13 = branch(
    1,
    52,
    50,
    NC,
    2.5
  );

  const dot54 = possibleDot(1, 54);
  const dot50 = possibleDot(1, 50);

  const lab54 = valueLabel(
    1,
    54,
    NC,
    1
  );

  const lab50 = valueLabel(
    1,
    50,
    NC,
    -1
  );

  fanEdges.push(up13, down13);
  fanNodes.push(dot54, dot50);

  edgeLevels[1] = [up13, down13];
  nodeLevels[1] = [dot50, dot54];

  await until(S(11));
  await play(
    ...fadeOut(demoParts),
    new M.FadeOut(forecastTag),
    new M.Create(up13),
    new M.FadeIn(dot54),
    new M.FadeIn(lab54),
    ...fbox([
      ['week 13: heads', UP],
      '52 + 2',
      ['= 54 cases', NC]
    ], UP),
    ...say('FIRST BRANCH: UP TO 54', UP)
  );

  await until(S(12));
  await play(
    new M.Create(down13),
    new M.FadeIn(dot50),
    new M.FadeIn(lab50),
    ...fbox([
      ['week 13: tails', DOWN],
      '52 − 2',
      ['= 50 cases', NC]
    ], DOWN),
    ...say('OTHER BRANCH: DOWN TO 50', DOWN)
  );

  function rangeBracket(k, low, high, color = PC) {
    const xx = x(k) + (P ? 0.29 : 0.32);

    const tick = P ? 0.11 : 0.13;

    return new M.VGroup(
      line(
        [xx, y(low), 0],
        [xx, y(high), 0],
        color,
        2
      ),
      line(
        [xx - tick, y(low), 0],
        [xx + tick, y(low), 0],
        color,
        2
      ),
      line(
        [xx - tick, y(high), 0],
        [xx + tick, y(high), 0],
        color,
        2
      )
    );
  }

  let rangeNow = rangeBracket(
    1,
    50,
    54
  );

  function pathsTag(k, n) {
    const tag = pill(
      `${n} PATHS`,
      PC,
      P ? 15 : 16
    );

    tag.moveTo([
      x(k),
      P ? 2.62 : 1.14,
      0
    ]);

    return tag;
  }

  let pathTag = pathsTag(1, 2);

  await until(S(13));
  await play(
    new M.FadeIn(rangeNow),
    new M.FadeIn(pathTag),
    ...fbox([
      ['1 week ahead', PC],
      '2 possible paths',
      ['range: 50–54 cases', NC]
    ], PC),
    ...say('2 PATHS: FROM 50 TO 54', PC)
  );

  // Construct one new branching level.
  // Nodes are unique by demand value, while path multiplicities
  // are counted separately.

  function makeLevel(k) {
    const edges = [];

    for (const from of LEVELS[k - 1]) {
      edges.push(
        branch(k, from, from + STEP),
        branch(k, from, from - STEP)
      );
    }

    const nodes = LEVELS[k].map(
      v => possibleDot(k, v)
    );

    fanEdges.push(...edges);
    fanNodes.push(...nodes);

    edgeLevels[k] = edges;
    nodeLevels[k] = nodes;

    return [
      new M.LaggedStart(
        edges.map(e => new M.Create(e)),
        {
          lagRatio: 0.08,
          runTime: 1.25
        }
      ),
      new M.LaggedStart(
        nodes.map(n => new M.FadeIn(n)),
        {
          lagRatio: 0.09,
          runTime: 1.2
        }
      )
    ];
  }

  // ------------------------------------------------------------
  // 14–15: Each of the two first-week paths branches again.
  // Four sequences, three distinct ending values.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    new M.FadeOut(rangeNow),
    new M.FadeOut(pathTag),
    ...fadeOut([lab50, lab54]),
    ...makeLevel(2),
    ...fbox([
      'Each path branches',
      'into two again.',
      ['2 × 2 = 4 paths', PC]
    ], PC),
    ...say('EVERY PATH BRANCHES INTO TWO', PC)
  );

  rangeNow = rangeBracket(
    2,
    48,
    56
  );

  pathTag = pathsTag(2, 4);

  const lab48 = valueLabel(
    2,
    48,
    NC,
    -1
  );

  const lab56 = valueLabel(
    2,
    56,
    NC,
    1
  );

  await until(S(15));
  await play(
    new M.FadeIn(rangeNow),
    new M.FadeIn(pathTag),
    new M.FadeIn(lab48),
    new M.FadeIn(lab56),
    ...fbox([
      ['2 weeks ahead', PC],
      '4 possible paths',
      ['range: 48–56 cases', NC]
    ], PC),
    ...say('4 PATHS: FROM 48 TO 56', PC)
  );

  // ------------------------------------------------------------
  // 16: Two different paths reach 52 in week fourteen.
  // Heads then tails, and tails then heads.
  // ------------------------------------------------------------

  const HT = [
    branch(1, 52, 54, FC, 4),
    branch(2, 54, 52, FC, 4)
  ];

  const TH = [
    branch(1, 52, 50, PC, 4),
    branch(2, 50, 52, PC, 4)
  ];

  const shared52 = ring(
    pt(2, 52),
    P ? 0.18 : 0.16,
    BC,
    2.5
  );

  const double52 = pill(
    '2 PATHS',
    BC,
    P ? 15 : 15
  );

  double52.moveTo([
    x(2) + (P ? 0.28 : 0.44),
    y(52) + (P ? 0.46 : 0.37),
    0
  ]);

  await until(S(16));
  await play(
    new M.LaggedStart(
      [
        ...HT.map(e => new M.Create(e)),
        ...TH.map(e => new M.Create(e))
      ],
      { lagRatio: 0.28, runTime: 2.0 }
    ),
    new M.Create(shared52),
    new M.FadeIn(double52),
    ...fbox([
      ['Heads, then tails:', FC],
      '52 + 2 − 2 = 52',
      ['Tails, then heads:', PC],
      '52 − 2 + 2 = 52'
    ], BC),
    ...say('TWO DIFFERENT PATHS, SAME ENDING', BC)
  );

  // ------------------------------------------------------------
  // 17: Eight paths after three weeks.
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...fadeOut([
      ...HT,
      ...TH,
      shared52,
      double52,
      rangeNow,
      pathTag,
      lab48,
      lab56
    ]),
    ...makeLevel(3),
    ...fbox([
      ['3 weeks ahead', PC],
      '4 × 2 = 8 paths',
      ['range: 46–58 cases', NC]
    ], PC),
    ...say('8 PATHS: FROM 46 TO 58', PC)
  );

  rangeNow = rangeBracket(
    3,
    46,
    58
  );

  pathTag = pathsTag(3, 8);

  await play(
    new M.FadeIn(rangeNow),
    new M.FadeIn(pathTag)
  );

  // ------------------------------------------------------------
  // 18: Sixteen paths after four weeks.
  // ------------------------------------------------------------

  const finalRange = rangeBracket(
    4,
    44,
    60
  );

  const finalPathTag = pathsTag(4, 16);

  await until(S(18));
  await play(
    ...fadeOut([
      rangeNow,
      pathTag
    ]),
    ...makeLevel(4),
    ...fbox([
      ['4 weeks ahead', PC],
      '8 × 2 = 16 paths',
      ['range: 44–60 cases', NC]
    ], PC),
    ...say('16 PATHS: FROM 44 TO 60', PC)
  );

  await play(
    new M.FadeIn(finalRange),
    new M.FadeIn(finalPathTag)
  );

  rangeNow = finalRange;
  pathTag = finalPathTag;

  // ------------------------------------------------------------
  // 19–24: Count the paths ending at each week-sixteen value.
  //
  // All 16 sequences are counted:
  // TTTT                 -> 44: 1
  // One head             -> 48: 4
  // Two heads            -> 52: 6
  // Three heads          -> 56: 4
  // HHHH                 -> 60: 1
  // ------------------------------------------------------------

  const endingParts = [];
  const endingRows = [];
  const endingTokens = [];
  const endingNumbers = [];

  const countHeading = txt(
    'PATHS',
    P ? 15 : 16,
    PC,
    [
      x(4) + (P ? 1.12 : 0.98),
      TOP + 0.05,
      0
    ],
    true
  );

  const endingHeading = txt(
    'WEEK 16 ENDINGS',
    P ? 21 : 18,
    C.ink,
    [CX, P ? 3.1 : 1.48, 0],
    true,
    P ? FW - 1.2 : 6.6
  );

  function endingRow(value, count) {
    const yy = y(value);

    const valueText = txt(
      value,
      P ? 15 : 16,
      NC,
      [
        x(4) - (P ? 0.23 : 0.27),
        yy + (P ? 0.21 : 0.17),
        0
      ],
      true
    );

    const tokens = [];

    const tokenSP = P ? 0.19 : 0.165;
    const tokenR = P ? 0.061 : 0.052;

    for (let j = 0; j < count; j++) {
      const d = new M.Dot({
        point: [
          x(4) + 0.37 + j * tokenSP,
          yy,
          0
        ],
        radius: tokenR,
        color: PC
      });

      d.setFill(PC, 1);

      tokens.push(d);
    }

    const countText = txt(
      count,
      P ? 20 : 21,
      PC,
      [COUNTX, yy, 0],
      true
    );

    endingTokens.push(tokens);
    endingNumbers.push(countText);

    endingParts.push(
      valueText,
      ...tokens,
      countText
    );

    return new M.VGroup(
      valueText,
      ...tokens,
      countText
    );
  }

  ENDINGS.forEach((v, k) => {
    endingRows.push(
      endingRow(v, ENDING_COUNTS[k])
    );
  });

  await until(S(19));
  await play(
    new M.FadeOut(rangeNow),
    new M.FadeOut(pathTag),
    new M.Transform(chartTitle, endingHeading),
    new M.FadeIn(countHeading),
    ...clearBox(),
    ...say('COUNT THE ENDINGS IN WEEK 16', PC)
  );

  await until(S(20));
  await play(
    new M.FadeIn(
      endingRows[0],
      { runTime: 0.30 }
    )
  );

  await until(S(21));
  await play(
    new M.FadeIn(
      endingRows[1],
      { runTime: 0.30 }
    )
  );

  await until(S(22));
  await play(
    new M.FadeIn(
      endingRows[2],
      { runTime: 0.30 }
    )
  );

  await until(S(23));
  await play(
    new M.FadeIn(
      endingRows[3],
      { runTime: 0.30 }
    )
  );

  await until(S(24));
  await play(
    new M.FadeIn(
      endingRows[4],
      { runTime: 0.30 }
    )
  );

  // ------------------------------------------------------------
  // 25: The full fan widens with the forecast horizon.
  // Show the highest and lowest possible paths.
  // ------------------------------------------------------------

  const upperPath = [];
  const lowerPath = [];

  for (let k = 1; k <= HORIZON; k++) {
    upperPath.push(
      branch(
        k,
        START_VALUE + (k - 1) * STEP,
        START_VALUE + k * STEP,
        PC,
        3.5
      )
    );

    lowerPath.push(
      branch(
        k,
        START_VALUE - (k - 1) * STEP,
        START_VALUE - k * STEP,
        PC,
        3.5
      )
    );
  }

  await until(S(25));
  await play(
    new M.LaggedStart(
      [
        ...upperPath.map(e => new M.Create(e)),
        ...lowerPath.map(e => new M.Create(e))
      ],
      { lagRatio: 0.10, runTime: 1.6 }
    ),
    ...fbox([
      ['The full range widens', PC],
      '1 week:  50–54',
      '2 weeks: 48–56',
      '3 weeks: 46–58',
      '4 weeks: 44–60'
    ], PC),
    ...say('MORE WEEKS, MORE POSSIBLE MOVES', PC)
  );

  // ------------------------------------------------------------
  // 26: The center stays at 52.
  // Pair equally distant upper and lower ending values.
  // ------------------------------------------------------------

  const centerTag = pill(
    'CENTER: 52',
    FC,
    P ? 15 : 16
  );

  centerTag.moveTo(TAGP);

  const pairOuter = [
    ring(pt(4, 44), 0.14, FC, 2),
    ring(pt(4, 60), 0.14, FC, 2)
  ];

  const pairInner = [
    ring(pt(4, 48), 0.14, FC, 2),
    ring(pt(4, 56), 0.14, FC, 2)
  ];

  const symmetryMarkers = [
    ...pairOuter,
    ...pairInner
  ];

  await until(S(26));
  await play(
    ...fadeOut([
      ...upperPath,
      ...lowerPath
    ]),
    new M.FadeIn(centerTag),
    ...fadeIn(symmetryMarkers),
    new M.Indicate(forecastLine, { color: FC }),
    ...fbox([
      ['The center stays at 52', FC],
      '44 and 60 balance',
      '48 and 56 balance',
      ['6 paths end at 52', NC]
    ], FC),
    ...say('EVERY UPWARD MOVE HAS A DOWNWARD PARTNER', FC)
  );

  // ------------------------------------------------------------
  // 27–28: Shade the prediction band at week sixteen.
  // Both boundary values, 48 and 56, are included.
  // ------------------------------------------------------------

  const bandLeft = x(4) - 0.22;
  const bandRight = COUNTX + 0.29;

  const bandWidth = bandRight - bandLeft;
  const bandHeight = y(BAND_HIGH) - y(BAND_LOW);

  const bandCenter = [
    (bandLeft + bandRight) / 2,
    (y(BAND_LOW) + y(BAND_HIGH)) / 2,
    0
  ];

  const band = rect(
    bandWidth,
    bandHeight,
    bandCenter,
    BC,
    0.15,
    2
  );

  const bandLowEdge = line(
    [bandLeft, y(BAND_LOW), 0],
    [bandRight, y(BAND_LOW), 0],
    BC,
    3
  );

  const bandHighEdge = line(
    [bandLeft, y(BAND_HIGH), 0],
    [bandRight, y(BAND_HIGH), 0],
    BC,
    3
  );

  const includedLow = ring(
    pt(4, BAND_LOW),
    0.17,
    BC,
    3
  );

  const includedHigh = ring(
    pt(4, BAND_HIGH),
    0.17,
    BC,
    3
  );

  const bandParts = [
    band,
    bandLowEdge,
    bandHighEdge,
    includedLow,
    includedHigh
  ];

  const bandTag = pill(
    '48–56 CASES',
    BC,
    P ? 16 : 17
  );

  const bandSoFar = txt(
    'WEEK 16: 48–56 CASES',
    P ? 23 : 21,
    BC,
    [CX, P ? 3.1 : 1.48, 0],
    true
  );

  await until(S(27));
  await play(
    ...fadeOut([
      ...symmetryMarkers,
      centerTag
    ]),
    new M.FadeIn(band),
    new M.Create(bandLowEdge),
    new M.Create(bandHighEdge),
    new M.Create(includedLow),
    new M.Create(includedHigh),
    new M.Transform(chartTitle, bandSoFar),
    ...fbox([
      ['week 16', BC],
      ['lower edge = 48', BC],
      ['upper edge = 56', BC],
      'both edges included'
    ], BC),
    ...say('SHADE FROM 48 TO 56, INCLUDING THE EDGES', BC)
  );

  const bandTitle = txt(
    'PREDICTION BAND: 48–56',
    P ? 24 : 22,
    BC,
    [CX, P ? 3.1 : 1.48, 0],
    true
  );

  await until(S(28));
  await play(
    new M.Transform(chartTitle, bandTitle),
    new M.Indicate(band, { color: BC }),
    ...fbox([
      ['prediction band', BC],
      'a range showing where',
      'future demand may land',
      ['48–56 cases here', BC]
    ], BC),
    ...say('PREDICTION BAND = A RANGE OF FUTURE DEMAND', BC)
  );

  // ------------------------------------------------------------
  // 29–31: Count the endings covered by the band.
  // Four at 48, six at 52, four at 56.
  // Every complete four-flip sequence has the same chance.
  // ------------------------------------------------------------

  const insideRows = [1, 2, 3];
  const outsideRows = [0, 4];

  const insideCountOutlines = insideRows.map(k =>
    rect(
      P ? 0.39 : 0.34,
      P ? 0.31 : 0.29,
      [COUNTX, y(ENDINGS[k]), 0],
      BC,
      0.08,
      2
    )
  );

  await until(S(29));
  await play(
    ...fadeIn(insideCountOutlines),
    new M.LaggedStart(
      insideRows.map(k =>
        new M.Indicate(
          endingNumbers[k],
          { color: BC }
        )
      ),
      { lagRatio: 0.32, runTime: 2.1 }
    ),
    ...fbox([
      ['Inside the band:', BC],
      '48 cases: 4 paths',
      '52 cases: 6 paths',
      '56 cases: 4 paths',
      ['4 + 6 + 4 = 14', BC]
    ], BC),
    ...say('4 + 6 + 4 = 14 PATHS INSIDE', BC)
  );

  await until(S(30));
  await play(
    ...fbox([
      ['Fair coin each week', FC],
      '2 equally likely moves',
      '4 fresh flips',
      ['16 equally likely paths', PC]
    ], PC),
    ...say('EVERY COMPLETE PATH HAS THE SAME CHANCE', FC)
  );

  // Show all 16 paths as tokens in the formula panel.
  // Fourteen green tokens are covered by the band.
  // Two violet tokens lie outside.

  const COVER_X = BOXP[0];
  const COVER_Y = BOXP[1];

  const coveragePanel = rounded(
    P ? 6.20 : 4.15,
    P ? 2.12 : 2.18,
    BOXP,
    BC
  );

  const coverageTitle = txt(
    'PATHS COVERED',
    P ? 20 : 19,
    BC,
    [COVER_X, COVER_Y + 0.79, 0],
    true
  );

  const coverageTokens = [];

  const TOKEN_SP = P ? 0.47 : 0.34;
  const TOKEN_R = P ? 0.13 : 0.105;

  for (let j = 0; j < 16; j++) {
    const row = Math.floor(j / 8);
    const col = j % 8;

    const xx =
      COVER_X + (col - 3.5) * TOKEN_SP;

    const yy =
      COVER_Y + 0.30 - row * 0.38;

    const color =
      j < BAND_COUNT ? BC : PC;

    const d = new M.Dot({
      point: [xx, yy, 0],
      radius: TOKEN_R,
      color
    });

    d.setFill(color, 1);

    coverageTokens.push(d);
  }

  const coverageResult = txt(
    '14 of 16 paths',
    P ? 26 : 24,
    BC,
    [COVER_X, COVER_Y - 0.55, 0],
    true
  );

  const coverageNote = txt(
    '2 paths outside',
    P ? 15 : 16,
    PC,
    [COVER_X, COVER_Y - 0.85, 0],
    true
  );

  const coverageParts = [
    coveragePanel,
    coverageTitle,
    ...coverageTokens,
    coverageResult,
    coverageNote
  ];

  await until(S(31));
  await play(
    ...clearBox(),
    new M.FadeIn(coveragePanel),
    new M.FadeIn(coverageTitle),
    new M.LaggedStart(
      coverageTokens.map(d => new M.FadeIn(d)),
      { lagRatio: 0.07, runTime: 1.45 }
    ),
    new M.FadeIn(coverageResult),
    new M.FadeIn(coverageNote),
    ...say('THE BAND COVERS 14 OF 16 PATHS', BC)
  );

  // ------------------------------------------------------------
  // 32: General method.
  // Generate future paths with surprises and choose a range
  // that covers the desired share of those paths.
  // ------------------------------------------------------------

  await until(S(32));
  await play(
    ...fadeOut(coverageParts),
    ...fbox([
      ['Build a prediction band:', BC],
      '1. Make future paths',
      '2. Add weekly surprises',
      '3. Choose a range',
      ['Here: 14 of 16 paths', BC]
    ], BC),
    ...say('BUILD PATHS, THEN CHOOSE THE RANGE', BC)
  );

  // ------------------------------------------------------------
  // 33: Use the band to consider stocking decisions.
  // No particular order quantity is claimed to be optimal.
  // The costs of shortages and excess stock matter.
  // ------------------------------------------------------------

  const orderingTag = pill(
    'PLAN FOR UNCERTAINTY',
    FC,
    P ? 16 : 16
  );

  orderingTag.moveTo(TAGP);

  await until(S(33));
  await play(
    new M.FadeIn(orderingTag),
    new M.Indicate(band, { color: BC }),
    ...fbox([
      ['Ordering decision', FC],
      'Too little stock:',
      ['risk of empty shelves', C.amber],
      'Too much stock:',
      ['risk of extra cases', PC]
    ], FC),
    ...say('BALANCE EMPTY SHELVES AGAINST EXTRA STOCK', FC)
  );

  // ------------------------------------------------------------
  // 34–35: Trap — a prediction band is not a hard limit.
  // One path ends at 44 and one ends at 60.
  // ------------------------------------------------------------

  const outsideLow = ring(
    pt(4, 44),
    P ? 0.20 : 0.18,
    FC,
    3
  );

  const outsideHigh = ring(
    pt(4, 60),
    P ? 0.20 : 0.18,
    FC,
    3
  );

  const warningTag = pill(
    'NOT HARD LIMITS',
    FC,
    P ? 16 : 16
  );

  warningTag.moveTo(TAGP);

  await until(S(34));
  await play(
    new M.FadeOut(orderingTag),
    new M.FadeIn(warningTag),
    new M.Indicate(bandLowEdge, { color: FC }),
    new M.Indicate(bandHighEdge, { color: FC }),
    ...fbox([
      ['Trap: hard limits', FC],
      'The band covers many',
      'possible outcomes.',
      ['Not every outcome.', FC]
    ], FC),
    ...say('THE BAND EDGES ARE NOT HARD LIMITS', FC)
  );

  const outsideHighlight = [
    ...upperPath,
    ...lowerPath
  ];

  const outsideCountOutlines = outsideRows.map(k =>
    rect(
      P ? 0.39 : 0.34,
      P ? 0.31 : 0.29,
      [COUNTX, y(ENDINGS[k]), 0],
      FC,
      0.08,
      2
    )
  );

  await until(S(35));
  await play(
    ...fadeIn(outsideHighlight),
    new M.Create(outsideLow),
    new M.Create(outsideHigh),
    ...fadeIn(outsideCountOutlines),
    new M.Indicate(endingNumbers[0], { color: FC }),
    new M.Indicate(endingNumbers[4], { color: FC }),
    ...fbox([
      ['Outside the band:', FC],
      '44 cases: 1 path',
      '60 cases: 1 path',
      ['1 + 1 = 2 paths', FC]
    ], FC),
    ...say('TWO PATHS END OUTSIDE THE BAND', FC)
  );

  // ------------------------------------------------------------
  // 36: Recap.
  // A prediction band shows a selected range of future demand.
  // It comes from paths built with week-by-week surprises.
  // The range is not a guarantee.
  // ------------------------------------------------------------

  const recapTitle = txt(
    'PREDICTION BANDS',
    P ? 25 : 22,
    BC,
    [CX, P ? 3.1 : 1.48, 0],
    true
  );

  const recapCenterTag = pill(
    'BEST GUESS: 52',
    FC,
    P ? 15 : 16
  );

  recapCenterTag.moveTo(TAGP);

  await until(S(36));
  await play(
    ...fadeOut([
      warningTag,
      ...outsideHighlight,
      ...outsideCountOutlines
    ]),
    new M.Transform(chartTitle, recapTitle),
    new M.FadeIn(recapCenterTag),
    ...fbox([
      ['Prediction band', BC],
      'weekly surprises: ±2',
      '16 possible paths',
      ['48–56 covers 14 paths', BC],
      ['2 paths remain outside', FC]
    ], BC),
    ...say('BUILD FUTURE PATHS, THEN MARK A RANGE', BC)
  );

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          startDot,
          { color: NC }
        ),
        new M.Indicate(
          forecastLine,
          { color: FC }
        ),
        new M.Indicate(
          band,
          { color: BC }
        ),
        new M.Indicate(
          outsideLow,
          { color: FC }
        ),
        new M.Indicate(
          outsideHigh,
          { color: FC }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: Math.min(
          3.4,
          Math.max(
            1.2,
            E(36) - S(36) - 1.6
          )
        )
      }
    )
  );
}
