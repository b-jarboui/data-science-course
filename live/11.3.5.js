// lesson 11.3.5
// Recursive multi-step forecasts.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Fixed shared chapter data.
  // Holiday week = 58 cases.
  // Next forecast = 25 + half of the starting count.

  const START = 58;
  const CONSTANT = 25;
  const WEIGHT = 0.5;
  const LONG_RUN = 50;

  const VALUES = [58, 54, 52, 51, 50.5];
  const HALVES = [29, 27, 26, 25.5];

  const NC = C.cyan;
  const FC = C.amber;
  const RC = C.violet;
  const GC = C.green;

  // Responsive layout.
  // Phone: 8 × 14.22, content between y=-5.5 and y=4.3.
  // Laptop: 14.22 × 8, content between y=-3.0 and y=2.3.

  const CX = P ? 0.15 : -2.60;
  const SP = P ? 1.34 : 1.56;
  const BASE = P ? -1.9 : -1.70;
  const UNIT = P ? 0.34 : 0.215;

  const PILL = P ? [0, 3.72, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -5.0, 0] : [4.25, -0.35, 0];

  const x = k => CX + (k - 2) * SP;
  const y = v => BASE + (v - 48) * UNIT;
  const pt = (k, v) => [x(k), y(v), 0];

  const LEFT = x(0) - SP / 2;
  const RIGHT = x(4) + SP / 2;
  const BOTTOM = y(48) - 0.18;
  const TOP = y(60) + 0.23;

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
    strokeWidth = 2.5,
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

  function glowDot(p, color, radius = 0.10) {
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

  function ring(p, radius, color, strokeWidth = 3) {
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

  // Formula box, following the approved reference lesson.

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
    const maxh = P ? 2.52 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

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
  // 0–2: Four future orders, but a rule that only takes one step.
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

  const INTRO_Y = P ? 1.0 : 0.2;

  const water = waterCase(0, INTRO_Y);

  const northTag = tag(
    'NORTH',
    NC,
    [0, INTRO_Y + 1.15, 0],
    23
  );

  const INTRO_SP = P ? 1.51 : 1.96;
  const INTRO_CW = P ? 1.25 : 1.55;
  const INTRO_CY = P ? -1.38 : -1.15;

  function introCard(k) {
    const xx = (k - 2.5) * INTRO_SP;

    const r = rounded(
      INTRO_CW,
      1.05,
      [xx, INTRO_CY, 0],
      FC
    );

    const heading = txt(
      `WEEK +${k}`,
      P ? 16 : 18,
      C.muted,
      [xx, INTRO_CY + 0.27, 0],
      true,
      INTRO_CW - 0.13
    );

    const q = txt(
      '?',
      30,
      FC,
      [xx, INTRO_CY - 0.17, 0],
      true
    );

    return new M.VGroup(r, heading, q);
  }

  const introCards = [1, 2, 3, 4].map(introCard);

  const oneStepTag = tag(
    'RULE: ONE WEEK AT A TIME',
    RC,
    [0, P ? -2.55 : -2.35, 0],
    P ? 19 : 18
  );

  const introArrowY = INTRO_CY + 0.79;

  const firstIntroArrow = arrow(
    [
      -1.5 * INTRO_SP,
      introArrowY,
      0
    ],
    [
      -0.5 * INTRO_SP,
      introArrowY,
      0
    ],
    RC,
    3
  );

  const remainingIntroArrows = [1, 2].map(k =>
    arrow(
      [
        (k - 1.5) * INTRO_SP,
        introArrowY,
        0
      ],
      [
        (k - 0.5) * INTRO_SP,
        introArrowY,
        0
      ],
      RC,
      2
    )
  );

  await until(S(0));
  await play(
    new M.FadeIn(water),
    new M.FadeIn(northTag),
    new M.LaggedStart(
      introCards.map(c => new M.FadeIn(c)),
      { lagRatio: 0.15, runTime: 1.45 }
    ),
    ...say('FOUR WEEKS, FOUR WATER ORDERS')
  );

  await until(S(1));
  await play(
    new M.FadeIn(oneStepTag),
    new M.FadeIn(firstIntroArrow),
    ...say('OUR RULE ONLY TAKES ONE STEP', RC)
  );

  await until(S(2));
  await play(
    new M.LaggedStart(
      remainingIntroArrows.map(a => new M.FadeIn(a)),
      { lagRatio: 0.35, runTime: 0.95 }
    ),
    new M.Indicate(introCards[3], { color: FC }),
    ...say('HOW DO WE REACH WEEK FOUR?', FC)
  );

  // ------------------------------------------------------------
  // 3–4: The holiday week is known.
  // The next four weeks are not known.
  // ------------------------------------------------------------

  const chartParts = [];
  const futureSlots = [];

  const chartTitle = txt(
    'NORTH: CASES WANTED',
    P ? 23 : 21,
    NC,
    [CX, P ? 2.72 : 1.42, 0],
    true,
    P ? FW - 1.2 : 7.0
  );

  chartParts.push(chartTitle);

  const floor = line(
    [LEFT, BOTTOM, 0],
    [RIGHT, BOTTOM, 0],
    C.muted,
    2
  );

  chartParts.push(floor);

  for (const v of [48, 50, 52, 54, 56, 58, 60]) {
    const yy = y(v);

    const guide = line(
      [LEFT, yy, 0],
      [RIGHT, yy, 0],
      C.muted,
      0.65
    );

    const label = txt(
      v,
      P ? 15 : 16,
      C.muted,
      [
        LEFT - (P ? 0.23 : 0.29),
        yy,
        0
      ],
      true
    );

    chartParts.push(guide, label);
  }

  function weekSlot(k) {
    const guide = line(
      [x(k), BOTTOM, 0],
      [x(k), TOP, 0],
      C.muted,
      0.70
    );

    const tick = line(
      [x(k), BOTTOM - 0.06, 0],
      [x(k), BOTTOM + 0.06, 0],
      C.muted,
      1.8
    );

    const label = txt(
      k === 0 ? 'NOW' : `+${k}`,
      P ? 17 : 17,
      k === 0 ? NC : C.muted,
      [x(k), BOTTOM - 0.26, 0],
      true,
      SP - 0.12
    );

    return new M.VGroup(guide, tick, label);
  }

  const currentSlot = weekSlot(0);

  chartParts.push(currentSlot);

  for (let k = 1; k <= 4; k++) {
    futureSlots.push(weekSlot(k));
  }

  const horizonLabel = txt(
    'Weeks ahead',
    P ? 18 : 17,
    C.muted,
    [(x(1) + x(4)) / 2, BOTTOM - 0.59, 0]
  );

  const startDot = glowDot(
    pt(0, START),
    NC,
    P ? 0.10 : 0.095
  );

  const startLabel = txt(
    START,
    25,
    NC,
    [x(0), y(START) + 0.33, 0],
    true
  );

  const holidayTag = tag(
    'HOLIDAY',
    NC,
    [
      x(0),
      y(START) - (P ? 0.55 : 0.49),
      0
    ],
    15,
    SP - 0.05
  );

  await until(S(3));
  await play(
    ...fadeOut([
      water,
      northTag,
      ...introCards,
      oneStepTag,
      firstIntroArrow,
      ...remainingIntroArrows
    ]),
    ...fadeIn(chartParts),
    new M.FadeIn(startDot),
    new M.FadeIn(startLabel),
    new M.FadeIn(holidayTag),
    ...say('HOLIDAY WEEK: 58 CASES', NC)
  );

  const emptyMarks = [];

  for (let k = 1; k <= 4; k++) {
    emptyMarks.push(
      txt(
        '?',
        P ? 25 : 24,
        C.muted,
        [x(k), y(56), 0],
        true
      )
    );
  }

  const knownLegend = tag(
    'FILLED = ACTUAL',
    NC,
    [
      CX - (P ? 1.72 : 1.78),
      P ? -3.15 : -3.05,
      0
    ],
    P ? 15 : 15,
    P ? 3.05 : 3.25
  );

  const forecastLegend = tag(
    'HOLLOW = FORECAST',
    FC,
    [
      CX + (P ? 1.72 : 1.78),
      P ? -3.15 : -3.05,
      0
    ],
    P ? 15 : 15,
    P ? 3.10 : 3.35
  );

  await until(S(4));
  await play(
    new M.LaggedStart(
      futureSlots.map(s => new M.FadeIn(s)),
      { lagRatio: 0.12, runTime: 1.25 }
    ),
    ...fadeIn(emptyMarks),
    new M.FadeIn(horizonLabel),
    new M.FadeIn(knownLegend),
    new M.FadeIn(forecastLegend),
    ...say('THE NEXT FOUR WEEKS ARE STILL UNKNOWN')
  );

  // ------------------------------------------------------------
  // Helpers for one-step forecasts.
  //
  // Pending arrow: point toward the next week's slot.
  // Completed arrow: connect the starting count to its result.
  //
  // No actual future observations are invented.
  // Every future forecast is a hollow dot.
  // ------------------------------------------------------------

  const stepArrows = [];
  const forecastDots = [];
  const forecastLabels = [];

  function stepArrow(k, from, to, color = FC) {
    const a = pt(k - 1, from);
    const b = pt(k, to);

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / length;
    const uy = dy / length;

    const inset = P ? 0.17 : 0.15;

    return arrow(
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
      2.7,
      0.15
    );
  }

  function forecast(k, value, color = FC) {
    return ring(
      pt(k, value),
      P ? 0.12 : 0.105,
      color,
      3
    );
  }

  function forecastLabel(k, value) {
    return txt(
      value,
      P ? 24 : 23,
      FC,
      [x(k), y(value) + 0.35, 0],
      true,
      SP - 0.15
    );
  }

  function nextStepBox(
    k,
    startingCount,
    half = null,
    result = null
  ) {
    const rows = [
      [`WEEK +${k}`, FC],
      `start = ${startingCount}`
    ];

    if (half !== null) {
      rows.push(
        [`half = ${half}`, RC]
      );
    }

    if (result !== null) {
      rows.push(
        `${half} + 25`,
        [`guess = ${result}`, FC]
      );
    }

    return fbox(rows, FC);
  }

  function beginStep(k) {
    const value = VALUES[k - 1];

    const a = stepArrow(k, value, value);

    stepArrows[k - 1] = a;

    return [
      new M.FadeOut(emptyMarks[k - 1]),
      new M.FadeIn(a)
    ];
  }

  function finishStep(k) {
    const value = VALUES[k];

    const d = forecast(k, value);
    const lab = forecastLabel(k, value);

    forecastDots[k - 1] = d;
    forecastLabels[k - 1] = lab;

    return [
      new M.Transform(
        stepArrows[k - 1],
        stepArrow(
          k,
          VALUES[k - 1],
          value
        )
      ),
      new M.FadeIn(d),
      new M.FadeIn(lab)
    ];
  }

  // ------------------------------------------------------------
  // 5: Take the first step from the known holiday count.
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    new M.FadeOut(holidayTag),
    ...beginStep(1),
    new M.Indicate(startDot, { color: NC }),
    ...nextStepBox(1, 58),
    ...say('STEP ONE: START FROM 58', FC)
  );

  // ------------------------------------------------------------
  // 6–9: Picture the rule before writing the full calculation.
  //
  // Starting amount 58:
  // split into two equal halves of 29;
  // keep one half;
  // add a fixed 25;
  // result 54.
  //
  // The working bars share one scale.
  // ------------------------------------------------------------

  const WORK_X = BOXP[0];
  const WORK_Y = BOXP[1];

  const WORK_W = P ? 6.15 : 4.2;
  const WORK_H = P ? 2.53 : 2.52;

  const BAR_MAX_W = WORK_W - 0.62;
  const WORK_UNIT = BAR_MAX_W / 58;

  const WORK_LEFT =
    WORK_X - BAR_MAX_W / 2;

  const WORK_BH = P ? 0.43 : 0.41;

  const PANEL_TOP =
    WORK_Y + WORK_H / 2;

  const WY1 = WORK_Y + 0.28;
  const WY2 = WORK_Y - 0.70;

  const workPanel = rounded(
    WORK_W,
    WORK_H,
    BOXP,
    FC
  );

  const workHeading = txt(
    'STARTING COUNT: 58',
    P ? 20 : 19,
    NC,
    [WORK_X, PANEL_TOP - 0.29, 0],
    true,
    WORK_W - 0.35
  );

  function workBar(
    v,
    offset,
    yy,
    color,
    opacity = 0.70
  ) {
    const width = v * WORK_UNIT;

    return rect(
      width,
      WORK_BH,
      [
        WORK_LEFT + offset * WORK_UNIT + width / 2,
        yy,
        0
      ],
      color,
      opacity,
      1.6
    );
  }

  function workBarText(
    s,
    v,
    offset,
    yy,
    color = C.ink
  ) {
    return txt(
      s,
      P ? 19 : 18,
      color,
      [
        WORK_LEFT +
        (offset + v / 2) * WORK_UNIT,
        yy,
        0
      ],
      true,
      v * WORK_UNIT - 0.12
    );
  }

  const whole = workBar(
    58,
    0,
    WY1,
    NC,
    0.33
  );

  const middle = line(
    [
      WORK_LEFT + 29 * WORK_UNIT,
      WY1 - WORK_BH / 2 - 0.09,
      0
    ],
    [
      WORK_LEFT + 29 * WORK_UNIT,
      WY1 + WORK_BH / 2 + 0.09,
      0
    ],
    RC,
    3
  );

  const halfQuestion1 = workBarText(
    'half',
    29,
    0,
    WY1,
    RC
  );

  const halfQuestion2 = workBarText(
    'half',
    29,
    29,
    WY1,
    RC
  );

  const splitNote = txt(
    'Split into two equal parts',
    P ? 18 : 17,
    C.muted,
    [WORK_X, WORK_Y - 0.22, 0],
    false,
    WORK_W - 0.35
  );

  await until(S(6));
  await play(
    ...clearBox(),
    ...fadeIn([
      workPanel,
      workHeading,
      whole,
      middle,
      halfQuestion1,
      halfQuestion2,
      splitNote
    ]),
    ...say('FIRST TAKE HALF OF THE STARTING COUNT', RC)
  );

  const halfText1 = workBarText(
    '29',
    29,
    0,
    WY1,
    NC
  );

  const halfText2 = workBarText(
    '29',
    29,
    29,
    WY1,
    NC
  );

  const keepHalf = workBar(
    29,
    0,
    WY2,
    RC,
    0.76
  );

  const keepHalfLabel = workBarText(
    '29',
    29,
    0,
    WY2,
    C.ink
  );

  const keepNote = txt(
    'Keep one half',
    P ? 17 : 16,
    RC,
    [WORK_X, WORK_Y - 0.20, 0],
    false
  );

  await until(S(7));
  await play(
    new M.Transform(halfQuestion1, halfText1),
    new M.Transform(halfQuestion2, halfText2),
    new M.Transform(splitNote, keepNote),
    new M.FadeIn(keepHalf),
    new M.FadeIn(keepHalfLabel),
    ...say('HALF OF 58 IS 29', RC)
  );

  const add25 = workBar(
    25,
    29,
    WY2,
    GC,
    0.75
  );

  const add25Label = workBarText(
    '+25',
    25,
    29,
    WY2,
    C.ink
  );

  const addNote = txt(
    'Add the fixed 25 cases',
    P ? 18 : 17,
    GC,
    [WORK_X, WORK_Y - 0.20, 0],
    false,
    WORK_W - 0.35
  );

  await until(S(8));
  await play(
    new M.Transform(splitNote, addNote),
    new M.FadeIn(add25),
    new M.FadeIn(add25Label),
    ...say('THEN ADD 25 CASES', GC)
  );

  const resultOutline = rect(
    54 * WORK_UNIT + 0.06,
    WORK_BH + 0.09,
    [
      WORK_LEFT + 27 * WORK_UNIT,
      WY2,
      0
    ],
    FC,
    0,
    2.5
  );

  const sumNote = txt(
    '29 + 25 = 54',
    P ? 24 : 23,
    FC,
    [WORK_X, WORK_Y - 0.20, 0],
    true
  );

  await until(S(9));
  await play(
    new M.Transform(splitNote, sumNote),
    new M.Create(resultOutline),
    ...say('29 + 25 = 54 CASES', FC)
  );

  const workParts = [
    workPanel,
    workHeading,
    whole,
    middle,
    halfQuestion1,
    halfQuestion2,
    splitNote,
    keepHalf,
    keepHalfLabel,
    add25,
    add25Label,
    resultOutline
  ];

  // ------------------------------------------------------------
  // 10: Place the first forecast at 54 cases.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...fadeOut(workParts),
    ...finishStep(1),
    ...fbox([
      ['WEEK +1', FC],
      'half of 58 = 29',
      '29 + 25 = 54',
      ['forecast = 54 cases', FC]
    ], FC),
    ...say('FIRST FORECAST: 54 CASES', FC)
  );

  // ------------------------------------------------------------
  // 11–12: To make another forecast, use the result we just made.
  // The first forecast is NOT a new observation.
  // ------------------------------------------------------------

  const inputOutline = ring(
    pt(1, 54),
    P ? 0.24 : 0.21,
    RC,
    2.5
  );

  const inputTag = tag(
    'NEXT INPUT',
    RC,
    [
      x(1),
      y(54) - (P ? 0.52 : 0.48),
      0
    ],
    14,
    SP * 1.5
  );

  await until(S(11));
  await play(
    new M.Create(inputOutline),
    new M.FadeIn(inputTag),
    ...fbox([
      ['To take another step...', RC],
      'We need a starting count',
      'for week +1.',
      ['Actual demand: unknown', C.muted]
    ], RC),
    ...say('THE RULE NEEDS ANOTHER STARTING COUNT', RC)
  );

  await until(S(12));
  await play(
    ...beginStep(2),
    new M.Indicate(
      forecastDots[0],
      { color: RC }
    ),
    ...fbox([
      ['Feed the forecast back', RC],
      ['previous guess = 54', FC],
      ['new input = 54', RC]
    ], RC),
    ...say('USE THE HOLLOW DOT AS THE NEXT INPUT', RC)
  );

  // ------------------------------------------------------------
  // 13–15: Second step.
  // Start from the first FORECAST, 54.
  // Half is 27; add 25 to get 52.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...fadeOut([
      inputOutline,
      inputTag
    ]),
    ...nextStepBox(
      2,
      VALUES[1],
      HALVES[1]
    ),
    ...say('HALF OF 54 IS 27', RC)
  );

  await until(S(14));
  await play(
    ...nextStepBox(
      2,
      VALUES[1],
      HALVES[1],
      VALUES[2]
    ),
    ...say('27 + 25 = 52 CASES', FC)
  );

  await until(S(15));
  await play(
    ...finishStep(2),
    new M.Indicate(
      forecastDots[0],
      { color: RC }
    ),
    ...say('SECOND FORECAST: 52 CASES', FC)
  );

  // ------------------------------------------------------------
  // 16–19: Third step.
  // Start from 52, take half (26), add 25, get 51.
  // ------------------------------------------------------------

  await until(S(16));
  await play(
    ...beginStep(3),
    new M.Indicate(
      forecastDots[1],
      { color: RC }
    ),
    ...nextStepBox(
      3,
      VALUES[2]
    ),
    ...say('FEED 52 INTO THE NEXT STEP', RC)
  );

  await until(S(17));
  await play(
    ...nextStepBox(
      3,
      VALUES[2],
      HALVES[2]
    ),
    ...say('HALF OF 52 IS 26', RC)
  );

  await until(S(18));
  await play(
    ...nextStepBox(
      3,
      VALUES[2],
      HALVES[2],
      VALUES[3]
    ),
    ...say('26 + 25 = 51 CASES', FC)
  );

  await until(S(19));
  await play(
    ...finishStep(3),
    ...say('THIRD FORECAST: 51 CASES', FC)
  );

  // ------------------------------------------------------------
  // 20–23: Fourth step.
  // Start from 51, take half (25.5), add 25, get 50.5.
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    ...beginStep(4),
    new M.Indicate(
      forecastDots[2],
      { color: RC }
    ),
    ...nextStepBox(
      4,
      VALUES[3]
    ),
    ...say('FEED 51 INTO THE FINAL STEP', RC)
  );

  await until(S(21));
  await play(
    ...nextStepBox(
      4,
      VALUES[3],
      HALVES[3]
    ),
    ...say('HALF OF 51 IS 25.5', RC)
  );

  await until(S(22));
  await play(
    ...nextStepBox(
      4,
      VALUES[3],
      HALVES[3],
      VALUES[4]
    ),
    ...say('25.5 + 25 = 50.5 CASES', FC)
  );

  await until(S(23));
  await play(
    ...finishStep(4),
    ...say('FOURTH FORECAST: 50.5 CASES', FC)
  );

  // ------------------------------------------------------------
  // 24: The forecasts move closer and closer to 50.
  //
  // Starting distance from 50: 8.
  // Forecast distances: 4, 2, 1, 0.5.
  // ------------------------------------------------------------

  const longRunLine = dashed(
    [LEFT, y(LONG_RUN), 0],
    [RIGHT, y(LONG_RUN), 0],
    GC
  );

  const levelLabel = txt(
    '50',
    P ? 21 : 20,
    GC,
    [
      LEFT - (P ? 0.23 : 0.29),
      y(LONG_RUN),
      0
    ],
    true
  );

  const distanceMarks = [];

  for (let k = 0; k <= 4; k++) {
    const xx = x(k) + (P ? 0.19 : 0.17);

    const d = line(
      [xx, y(LONG_RUN), 0],
      [xx, y(VALUES[k]), 0],
      GC,
      2.4
    );

    distanceMarks.push(d);
  }

  await until(S(24));
  await play(
    new M.Create(longRunLine),
    new M.FadeIn(levelLabel),
    new M.LaggedStart(
      distanceMarks.map(d => new M.Create(d)),
      { lagRatio: 0.13, runTime: 1.15 }
    ),
    ...fbox([
      ['Distance above 50', GC],
      '58   → 8',
      '54   → 4',
      '52   → 2',
      '51   → 1',
      '50.5 → 0.5'
    ], GC),
    ...say('THE GUESSES GET CLOSER TO 50', GC)
  );

  // ------------------------------------------------------------
  // 25–27: Why 50?
  // At 50, the rule returns 50 again.
  //
  // The long-run level is a fixed point of the forecast rule.
  // ------------------------------------------------------------

  const test50 = ring(
    [x(0), y(50), 0],
    P ? 0.13 : 0.12,
    GC,
    3
  );

  const test50Label = tag(
    'TRY 50',
    GC,
    [
      x(0) + 0.12,
      y(50) - (P ? 0.36 : 0.30),
      0
    ],
    14,
    SP
  );

  await until(S(25));
  await play(
    ...fadeOut(distanceMarks),
    new M.Create(test50),
    new M.FadeIn(test50Label),
    ...fbox([
      ['Try a starting count of 50', GC],
      'start = 50',
      ['half = 25', RC]
    ], GC),
    ...say('IF WE START AT 50, HALF IS 25', GC)
  );

  const test50Next = ring(
    [x(1), y(50), 0],
    P ? 0.13 : 0.12,
    GC,
    3
  );

  const test50Arrow = stepArrow(
    1,
    50,
    50,
    GC
  );

  await until(S(26));
  await play(
    new M.FadeIn(test50Arrow),
    new M.FadeIn(test50Next),
    ...fbox([
      ['Start from 50', GC],
      'half of 50 = 25',
      '25 + 25 = 50',
      ['back at 50', GC]
    ], GC),
    ...say('ADD 25 AND WE LAND BACK AT 50', GC)
  );

  const longRunTag = tag(
    'LONG-RUN LEVEL: 50',
    GC,
    [
      CX,
      y(50) - (P ? 0.43 : 0.34),
      0
    ],
    P ? 17 : 16,
    P ? 4.8 : 4.5
  );

  await until(S(27));
  await play(
    ...fadeOut([
      test50,
      test50Label,
      test50Next,
      test50Arrow
    ]),
    new M.FadeIn(longRunTag),
    new M.Indicate(
      longRunLine,
      { color: GC }
    ),
    ...fbox([
      ['Long-run level', GC],
      'The height forecasts',
      'move toward over time.',
      ['50 = 25 + half of 50', GC]
    ], GC),
    ...say('50 IS THE LONG-RUN LEVEL', GC)
  );

  // ------------------------------------------------------------
  // 28–29: Name the process.
  //
  // Recursion: each result supplies the next input.
  // Recursive multi-step forecast: repeat that process
  // to reach several future weeks.
  // ------------------------------------------------------------

  const recursiveTitle = txt(
    'RECURSIVE FORECASTS',
    P ? 23 : 21,
    RC,
    [CX, P ? 2.72 : 1.42, 0],
    true,
    P ? FW - 1.2 : 7.0
  );

  const recursionRings = forecastDots.slice(0, 3).map(
    (_, k) =>
      ring(
        pt(k + 1, VALUES[k + 1]),
        P ? 0.22 : 0.19,
        RC,
        2
      )
  );

  await until(S(28));
  await play(
    new M.Transform(chartTitle, recursiveTitle),
    new M.LaggedStart(
      recursionRings.map(r => new M.Create(r)),
      { lagRatio: 0.30, runTime: 1.6 }
    ),
    ...fbox([
      ['Recursion', RC],
      'Use each result as',
      'the next starting point.',
      ['54 → 52 → 51 → 50.5', FC]
    ], RC),
    ...say('RESULT BECOMES INPUT: RECURSION', RC)
  );

  const multiTitle = txt(
    'RECURSIVE MULTI-STEP FORECAST',
    P ? 22 : 20,
    RC,
    [CX, P ? 2.72 : 1.42, 0],
    true,
    P ? FW - 1.2 : 7.0
  );

  await until(S(29));
  await play(
    ...fadeOut(recursionRings),
    new M.Transform(chartTitle, multiTitle),
    new M.LaggedStart(
      stepArrows.map(a =>
        new M.Indicate(
          a,
          { color: RC }
        )
      ),
      { lagRatio: 0.32, runTime: 2.1 }
    ),
    ...fbox([
      ['Recursive multi-step', RC],
      ['week +1: 54', FC],
      ['week +2: 52', FC],
      ['week +3: 51', FC],
      ['week +4: 50.5', FC]
    ], RC),
    ...say('REPEAT THE RULE TO REACH MORE WEEKS', RC)
  );

  // ------------------------------------------------------------
  // 30–31: State the rule in words.
  // Emphasize that subsequent inputs are forecasts,
  // not actual future observations.
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    ...fbox([
      ['The one-step rule', GC],
      'next week’s guess',
      '= 25 + half of',
      'the starting count',
      ['example: 25 + 29 = 54', FC]
    ], GC),
    ...say('NEXT GUESS = 25 + HALF THE STARTING COUNT', GC)
  );

  await until(S(31));
  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          forecastDots[0],
          { color: RC }
        ),
        new M.Indicate(
          forecastDots[1],
          { color: RC }
        ),
        new M.Indicate(
          forecastDots[2],
          { color: RC }
        )
      ],
      { lagRatio: 0.32, runTime: 1.8 }
    ),
    ...fbox([
      ['First step', NC],
      'use the last actual count',
      ['Later steps', RC],
      'use the previous guess',
      ['not a future actual', C.muted]
    ], RC),
    ...say('EACH LATER STEP USES THE PREVIOUS GUESS', RC)
  );

  // ------------------------------------------------------------
  // 32: Use the four-week forecast to plan an order.
  // The forecast is 50.5 cases, not a claim that the
  // supplier delivers fractional cases.
  // ------------------------------------------------------------

  const fourthRing = ring(
    pt(4, VALUES[4]),
    P ? 0.25 : 0.22,
    GC,
    3
  );

  const fourWeekTag = tag(
    '4 WEEKS AHEAD',
    GC,
    [
      x(4) - (P ? 0.47 : 0.49),
      y(54) + (P ? 0.40 : 0.33),
      0
    ],
    P ? 15 : 15,
    P ? 2.70 : 2.80
  );

  const orderGuide = dashed(
    [
      x(4),
      y(54) - 0.15,
      0
    ],
    [
      x(4),
      y(VALUES[4]) + 0.62,
      0
    ],
    GC
  );

  await until(S(32));
  await play(
    new M.Create(fourthRing),
    new M.FadeIn(fourWeekTag),
    new M.Create(orderGuide),
    ...fbox([
      ['Order planning', GC],
      'notice needed: 4 weeks',
      ['forecast = 50.5 cases', FC],
      'use the fourth dot'
    ], GC),
    ...say('USE THE FOURTH DOT FOR THE EARLY ORDER', GC)
  );

  // ------------------------------------------------------------
  // 33–34: Trap — early errors can travel forward.
  //
  // A clearly labelled hypothetical illustration:
  // if the first forecast were 2 cases higher,
  // 56 instead of 54, then the next forecast would
  // be 53 instead of 52.
  //
  // These are alternate forecasts, not new actual data.
  // The original fixed chapter example stays unchanged.
  // ------------------------------------------------------------

  const errorTitle = txt(
    'AN EARLY MISS CAN TRAVEL FORWARD',
    P ? 21 : 19,
    RC,
    [CX, P ? 2.72 : 1.42, 0],
    true,
    P ? FW - 1.2 : 7.0
  );

  const earlyHighlight = ring(
    pt(1, VALUES[1]),
    P ? 0.24 : 0.21,
    RC,
    2.5
  );

  const propagationArrow = stepArrow(
    2,
    VALUES[1],
    VALUES[2],
    RC
  );

  const propagationTag = tag(
    'ERROR CAN TRAVEL',
    RC,
    [
      (x(1) + x(2)) / 2,
      y(56) + (P ? 0.51 : 0.43),
      0
    ],
    15,
    P ? 3.6 : 3.5
  );

  await until(S(33));
  await play(
    ...fadeOut([
      fourthRing,
      fourWeekTag,
      orderGuide
    ]),
    new M.Transform(chartTitle, errorTitle),
    new M.Create(earlyHighlight),
    new M.FadeIn(propagationArrow),
    new M.FadeIn(propagationTag),
    ...fbox([
      ['Trap', RC],
      'An early forecast',
      'becomes a later input.',
      ['Its error can travel too.', RC]
    ], RC),
    ...say('AN EARLY MISS CAN TRAVEL FORWARD', RC)
  );

  const hypotheticalFirst = 56;
  const hypotheticalSecond =
    CONSTANT + WEIGHT * hypotheticalFirst;

  const alternate1 = forecast(
    1,
    hypotheticalFirst,
    RC
  );

  const alternate2 = forecast(
    2,
    hypotheticalSecond,
    RC
  );

  const altLabel1 = txt(
    hypotheticalFirst,
    P ? 22 : 21,
    RC,
    [
      x(1),
      y(hypotheticalFirst) + 0.26,
      0
    ],
    true
  );

  const altLabel2 = txt(
    hypotheticalSecond,
    P ? 22 : 21,
    RC,
    [
      x(2) + 0.30,
      y(hypotheticalSecond) + 0.25,
      0
    ],
    true
  );

  const altArrow = stepArrow(
    2,
    hypotheticalFirst,
    hypotheticalSecond,
    RC
  );

  function errorGap(
    k,
    original,
    alternative
  ) {
    const xx = x(k) - (P ? 0.18 : 0.17);

    return line(
      [xx, y(original), 0],
      [xx, y(alternative), 0],
      RC,
      3.2
    );
  }

  const error1 = errorGap(
    1,
    VALUES[1],
    hypotheticalFirst
  );

  const error2 = errorGap(
    2,
    VALUES[2],
    hypotheticalSecond
  );

  const errorLabel1 = txt(
    '+2',
    P ? 17 : 17,
    RC,
    [
      x(1) - 0.40,
      (y(54) + y(56)) / 2,
      0
    ],
    true
  );

  const errorLabel2 = txt(
    '+1',
    P ? 17 : 17,
    RC,
    [
      x(2) - 0.40,
      (y(52) + y(53)) / 2,
      0
    ],
    true
  );

  const hypotheticalTag = tag(
    'WHAT IF THE FIRST GUESS IS TOO HIGH?',
    RC,
    [
      CX,
      P ? 2.14 : 0.98,
      0
    ],
    P ? 16 : 15,
    P ? 6.6 : 6.8
  );

  const alternateParts = [
    alternate1,
    alternate2,
    altLabel1,
    altLabel2,
    altArrow,
    error1,
    error2,
    errorLabel1,
    errorLabel2,
    hypotheticalTag
  ];

  await until(S(34));
  await play(
    ...fadeOut([
      earlyHighlight,
      propagationArrow,
      propagationTag
    ]),
    new M.FadeIn(hypotheticalTag),
    new M.LaggedStart(
      [
        new M.FadeIn(alternate1),
        new M.FadeIn(altLabel1),
        new M.Create(error1),
        new M.FadeIn(errorLabel1),
        new M.FadeIn(altArrow),
        new M.FadeIn(alternate2),
        new M.FadeIn(altLabel2),
        new M.Create(error2),
        new M.FadeIn(errorLabel2)
      ],
      { lagRatio: 0.18, runTime: 2.5 }
    ),
    ...fbox([
      ['Hypothetical example', RC],
      'first guess: 56, not 54',
      ['extra = 2 cases', RC],
      '25 + half of 56 = 53',
      ['extra next time = 1', RC]
    ], RC),
    ...say('HALF THE EXTRA ERROR PASSES INTO THE NEXT GUESS', RC)
  );

  // ------------------------------------------------------------
  // 35: Recap.
  //
  // One observed value, followed by four forecast values.
  // Each forecast is used to produce the next forecast.
  // 58 → 54 → 52 → 51 → 50.5.
  // The forecasts approach the long-run level of 50.
  // ------------------------------------------------------------

  const recapTitle = txt(
    'RECURSIVE MULTI-STEP FORECAST',
    P ? 22 : 20,
    GC,
    [CX, P ? 2.72 : 1.42, 0],
    true,
    P ? FW - 1.2 : 7.0
  );

  const recapArrows = [];

  for (let k = 2; k <= 4; k++) {
    recapArrows.push(
      stepArrow(
        k,
        VALUES[k - 1],
        VALUES[k],
        RC
      )
    );
  }

  await until(S(35));
  await play(
    ...fadeOut(alternateParts),
    new M.Transform(chartTitle, recapTitle),
    new M.LaggedStart(
      recapArrows.map(a => new M.FadeIn(a)),
      { lagRatio: 0.26, runTime: 1.3 }
    ),
    ...fbox([
      ['Next = 25 + half of input', GC],
      ['actual: 58', NC],
      ['+1: 54     +2: 52', FC],
      ['+3: 51     +4: 50.5', FC],
      ['feed each guess forward', RC]
    ], GC),
    ...say('LET EACH FORECAST SUPPLY THE NEXT STARTING COUNT', GC)
  );

  await play(
    new M.LaggedStart(
      forecastDots.map(d =>
        new M.Indicate(
          d,
          { color: FC }
        )
      ),
      {
        lagRatio: 0.32,
        runTime: Math.min(
          2.3,
          Math.max(
            1.0,
            E(35) - S(35) - 1.6
          )
        )
      }
    )
  );
}
