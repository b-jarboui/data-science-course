// lesson 12.4.9
// Brier score — live, narration-synchronised lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser playback has not been verified here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed chapter data.
  // ------------------------------------------------------------

  const DATA = [
    { id: 'P1',  actual: 12, a: 18, b: 14, prob: 90, failed: false },
    { id: 'P2',  actual: 8,  a: 8,  b: 10, prob: 60, failed: true  },
    { id: 'P3',  actual: 14, a: 14, b: 12, prob: 60, failed: false },
    { id: 'P4',  actual: 6,  a: 8,  b: 7,  prob: 30, failed: true  },
    { id: 'P5',  actual: 16, a: 15, b: 14, prob: 30, failed: false },
    { id: 'P6',  actual: 20, a: 22, b: 20, prob: 30, failed: false },
    { id: 'P7',  actual: 18, a: 17, b: 20, prob: 10, failed: false },
    { id: 'P8',  actual: 22, a: 22, b: 21, prob: 10, failed: false },
    { id: 'P9',  actual: 24, a: 25, b: 24, prob: 10, failed: false },
    { id: 'P10', actual: 26, a: 24, b: 25, prob: 10, failed: false },
    { id: 'P11', actual: 28, a: 28, b: 28, prob: 10, failed: false },
    { id: 'P12', actual: 30, a: 31, b: 30, prob: 10, failed: false }
  ].map(d => {
    const p = d.prob / 100;
    const y = d.failed ? 1 : 0;
    const gap = Math.abs(p - y);
    const squared = (p - y) ** 2;

    return {
      ...d,
      p,
      y,
      gap,
      squared
    };
  });

  const IDS = DATA.map((_, i) => i);

  const FAILURES = IDS.filter(i =>
    DATA[i].failed
  );

  const SAFE = IDS.filter(i =>
    !DATA[i].failed
  );

  const SUM = DATA.reduce(
    (s, d) => s + d.squared,
    0
  );

  const BRIER = SUM / DATA.length;

  const PREVALENCE =
    FAILURES.length / DATA.length;

  function constantScore(p) {
    return DATA.reduce(
      (s, d) => s + (p - d.y) ** 2,
      0
    ) / DATA.length;
  }

  const SCORE50 = constantScore(0.5);
  const SCORE_PREVALENCE = constantScore(PREVALENCE);

  const fmt = (v, digits = 2) =>
    Number(v).toFixed(digits);

  // Checked values:
  //
  // P1  = 0.81
  // P2  = 0.16
  // P3  = 0.36
  // P4  = 0.49
  // P5  = 0.09
  // P6  = 0.09
  // P7  = 0.01
  // P8  = 0.01
  // P9  = 0.01
  // P10 = 0.01
  // P11 = 0.01
  // P12 = 0.01
  //
  // Sum = 2.06.
  // Brier = 2.06 / 12 = 0.171666...
  //
  // Constant 50% forecast = 0.25.
  // Constant 1/6 forecast = 5/36 = 0.138888...
  //
  // The prevalence of 1/6 is estimated from these same
  // twelve pumps. It is a descriptive reference, not an
  // independently fitted or validated reference model.

  // ------------------------------------------------------------
  // Fixed chapter colours and visual meanings.
  // ------------------------------------------------------------

  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;
  const VIOLET = C.violet || '#A78BFA';

  // ------------------------------------------------------------
  // Responsive laptop / phone layout.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.30, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function text(
    s, size, color, x, y,
    mono = false,
    maxw = null
  ) {
    const t = T(s, size, color, mono);

    if (
      maxw !== null &&
      t.getWidth() > maxw
    ) {
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

  function rect(
    x, y, w, h,
    color,
    opacity = 0.2,
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

  function circle(
    x, y, radius,
    color,
    opacity = 1,
    sw = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function lag(
    anims,
    runTime = 1.2,
    lagRatio = 0.12
  ) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
    });
  }

  const fadeIn = objects =>
    objects.filter(Boolean).map(o =>
      new M.FadeIn(o)
    );

  const fadeOut = objects =>
    objects.filter(Boolean).map(o =>
      new M.FadeOut(o)
    );

  function indicate(
    objects,
    color = AMBER
  ) {
    return objects.filter(Boolean).map(o =>
      new M.Indicate(o, {
        color,
        runTime: 0.75
      })
    );
  }

  // ------------------------------------------------------------
  // Named scene slots.
  //
  // Objects in each slot are independently added and removed.
  // Already-visible objects are never wrapped in a new VGroup.
  // ------------------------------------------------------------

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
    return keys.flatMap(key =>
      replace(key, [])
    );
  }

  function get(key) {
    return slots.get(key) || [];
  }

  // ------------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(
    lines,
    color = C.cyan
  ) {
    const size = P ? 22 : 21;
    const lh = P ? 0.34 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l)
        ? l
        : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true
      ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.38;

    const r = rounded(
      BOXP[0],
      BOXP[1],
      wd,
      ht,
      color,
      C.card,
      0.95,
      2,
      0.18
    );

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.19 - lh / 2;

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

    const g = new M.VGroup(
      r,
      ...texts
    );

    const maxw = P
      ? FW - 1.2
      : 4.0;

    const maxh = P
      ? 1.34
      : 2.60;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const anims = [];

    if (boxNow) {
      anims.push(
        new M.FadeOut(boxNow)
      );
    }

    anims.push(
      new M.FadeIn(g)
    );

    boxNow = g;

    return anims;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [
      new M.FadeOut(old)
    ];
  }

  // ------------------------------------------------------------
  // Shared chapter icons.
  // ------------------------------------------------------------

  // Water pump: motor, housing, inlet, outlet and feet.
  function pumpIcon(
    x,
    y,
    s = 1,
    color = C.cyan
  ) {
    const motor = rounded(
      x - 0.29 * s,
      y,
      0.60 * s,
      0.40 * s,
      color,
      color,
      0.14,
      2,
      0.07 * s
    );

    const fins = [-0.47, -0.35, -0.23].map(dx =>
      line(
        x + dx * s,
        y - 0.13 * s,
        x + dx * s,
        y + 0.13 * s,
        color,
        1.3
      )
    );

    const housing = circle(
      x + 0.19 * s,
      y,
      0.27 * s,
      color,
      0.12
    );

    const inlet = rect(
      x + 0.51 * s,
      y,
      0.20 * s,
      0.15 * s,
      color,
      0.15,
      1.5
    );

    const outlet = rect(
      x + 0.19 * s,
      y + 0.36 * s,
      0.17 * s,
      0.26 * s,
      color,
      0.15,
      1.5
    );

    const hub = circle(
      x + 0.19 * s,
      y,
      0.06 * s,
      color,
      1,
      1
    );

    const foot1 = rect(
      x - 0.29 * s,
      y - 0.26 * s,
      0.22 * s,
      0.10 * s,
      color,
      0.35,
      1
    );

    const foot2 = rect(
      x + 0.19 * s,
      y - 0.26 * s,
      0.22 * s,
      0.10 * s,
      color,
      0.35,
      1
    );

    return new M.VGroup(
      motor,
      ...fins,
      housing,
      inlet,
      outlet,
      hub,
      foot1,
      foot2
    );
  }

  // Red filled diamond = actual failure.
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

  // Green outlined circle = no failure within ten hours.
  function safeIcon(x, y, s = 1) {
    return circle(
      x,
      y,
      0.11 * s,
      GREEN,
      0,
      2.4
    );
  }

  // ------------------------------------------------------------
  // Shared pump card design.
  //
  // Blue = predicted probability.
  // Red diamond or green outlined circle = recorded outcome.
  // Violet = squared probability error.
  //
  // No alert bells are used in this lesson because Brier
  // score assesses probabilities directly, without a cutoff.
  // ------------------------------------------------------------

  const CARD_W = 1.24;
  const CARD_H = 1.10;

  function cardBase(id, x, y, s = 1) {
    const frame = rounded(
      x,
      y,
      CARD_W * s,
      CARD_H * s,
      C.muted,
      C.card,
      0.96,
      1.6,
      0.10 * s
    );

    const label = text(
      id,
      Math.max(12, Math.round(19 * s)),
      C.ink,
      x - 0.16 * s,
      y + 0.32 * s,
      true,
      0.66 * s
    );

    const icon = pumpIcon(
      x - 0.18 * s,
      y - 0.015 * s,
      0.46 * s,
      C.cyan
    );

    const divider = line(
      x - 0.48 * s,
      y - 0.22 * s,
      x + 0.48 * s,
      y - 0.22 * s,
      C.muted,
      1
    );

    return new M.VGroup(
      frame,
      label,
      icon,
      divider
    );
  }

  function chanceLabel(
    value,
    x,
    y,
    s = 1,
    decimal = false
  ) {
    const label = decimal
      ? fmt(value / 100, 1)
      : `${value}%`;

    return text(
      label,
      Math.max(12, Math.round(19 * s)),
      BLUE,
      x,
      y - 0.36 * s,
      true,
      0.86 * s
    );
  }

  function outcomeMark(
    failed,
    x,
    y,
    s = 1
  ) {
    return failed
      ? failureIcon(
          x + 0.37 * s,
          y - 0.055 * s,
          s
        )
      : safeIcon(
          x + 0.37 * s,
          y - 0.055 * s,
          s
        );
  }

  function completeCard(
    i,
    x,
    y,
    s = 1,
    prediction = DATA[i].prob,
    decimal = false
  ) {
    const d = DATA[i];

    return new M.VGroup(
      cardBase(d.id, x, y, s),
      chanceLabel(
        prediction,
        x,
        y,
        s,
        decimal
      ),
      outcomeMark(
        d.failed,
        x,
        y,
        s
      )
    );
  }

  // ------------------------------------------------------------
  // 0–4: Introduce two hypothetical forecasts.
  //
  // These are illustrative forecasts, not extra observations.
  // Both pumps survive, but one forecast was much more
  // confident that failure would happen.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.55 : -0.42;

  const introPositions = [
    [CX - 1.65, INTRO_Y, 0],
    [CX + 1.65, INTRO_Y, 0]
  ];

  const INTRO_SCALE = 1.68;

  const introCards = introPositions.map((p, i) =>
    cardBase(
      i === 0 ? 'Pump A' : 'Pump B',
      p[0],
      p[1],
      INTRO_SCALE
    )
  );

  const introChances = [60, 90].map((v, i) =>
    chanceLabel(
      v,
      introPositions[i][0],
      introPositions[i][1],
      INTRO_SCALE
    )
  );

  const introOutcomes = introPositions.map(p =>
    outcomeMark(
      false,
      p[0],
      p[1],
      INTRO_SCALE
    )
  );

  const hypotheticalHeading = text(
    'TWO EXAMPLE PREDICTIONS',
    20,
    C.ink,
    CX,
    P ? 1.20 : 1.02,
    true,
    6.50
  );

  const introSurvived = introPositions.map(p =>
    text(
      'NO FAILURE',
      17,
      GREEN,
      p[0],
      p[1] - 1.23,
      true,
      2.60
    )
  );

  const introQuestion = text(
    'Equally poor predictions?',
    23,
    AMBER,
    CX,
    P ? -3.10 : -2.48,
    false,
    6.50
  );

  await until(S(0));
  await play(
    new M.FadeIn(hypotheticalHeading),
    ...fadeIn(introCards),
    ...say('TWO WATER PUMP PREDICTIONS')
  );

  await until(S(1));
  await play(
    new M.FadeIn(introChances[0]),
    ...fbox([
      ['first prediction', BLUE],
      '60% chance of failure',
      'within the next 10 hours'
    ], BLUE),
    ...say('FIRST PUMP: 60% CHANCE OF FAILURE', BLUE)
  );

  await until(S(2));
  await play(
    new M.FadeIn(introChances[1]),
    ...fbox([
      ['first pump: 60%', BLUE],
      ['second pump: 90%', BLUE]
    ], BLUE),
    ...say('SECOND PUMP: 90% CHANCE OF FAILURE', BLUE)
  );

  await until(S(3));
  await play(
    ...fadeIn(introOutcomes),
    ...fadeIn(introSurvived),
    ...fbox([
      ['10 hours later', WHITE],
      ['neither pump failed', GREEN]
    ], GREEN),
    ...say('NEITHER PUMP ACTUALLY FAILS', GREEN)
  );

  await until(S(4));
  await play(
    new M.FadeIn(introQuestion),
    ...indicate(introChances, AMBER),
    ...fbox([
      ['60% versus 90%', BLUE],
      'same recorded outcome',
      ['equally poor predictions?', AMBER]
    ], AMBER),
    ...say('SHOULD THE TWO MISTAKES COUNT EQUALLY?', AMBER)
  );

  // ------------------------------------------------------------
  // 5–9: Return to P1, P2 and P3 from the fixed data.
  // ------------------------------------------------------------

  const THREE_IDS = [0, 1, 2];

  const THREE_Y = P ? -0.45 : -0.32;
  const THREE_SCALE = P ? 1.40 : 1.35;
  const THREE_SP = 2.05;

  const threePositions = THREE_IDS.map((_, j) => [
    CX + (j - 1) * THREE_SP,
    THREE_Y,
    0
  ]);

  const threeCards = THREE_IDS.map((i, j) => {
    const p = threePositions[j];

    return cardBase(
      DATA[i].id,
      p[0],
      p[1],
      THREE_SCALE
    );
  });

  const threeChances = THREE_IDS.map((i, j) => {
    const p = threePositions[j];

    return chanceLabel(
      DATA[i].prob,
      p[0],
      p[1],
      THREE_SCALE
    );
  });

  const threeOutcomes = THREE_IDS.map((i, j) => {
    const p = threePositions[j];

    return outcomeMark(
      DATA[i].failed,
      p[0],
      p[1],
      THREE_SCALE
    );
  });

  const threeOutcomeLabels = THREE_IDS.map((i, j) =>
    text(
      DATA[i].failed
        ? 'FAILED'
        : 'NO FAILURE',
      17,
      DATA[i].failed
        ? RED
        : GREEN,
      threePositions[j][0],
      THREE_Y - 1.05,
      true,
      1.90
    )
  );

  await until(S(5));
  await play(
    ...fadeOut([
      hypotheticalHeading,
      ...introCards,
      ...introChances,
      ...introOutcomes,
      ...introSurvived,
      introQuestion
    ]),
    ...clearBox(),
    lag(
      fadeIn(threeCards),
      0.95,
      0.20
    ),
    ...say('BRING BACK THREE OF OUR TWELVE PUMPS')
  );

  await until(S(6));
  await play(
    new M.FadeIn(threeChances[0]),
    ...say('P1: 90% PREDICTED FAILURE CHANCE', BLUE)
  );

  await until(S(7));
  await play(
    ...fadeIn([
      threeChances[1],
      threeChances[2]
    ]),
    ...say('P2 AND P3: 60% EACH', BLUE)
  );

  await until(S(8));
  await play(
    ...fadeIn(threeOutcomeLabels),
    ...fbox([
      ['P2 failed', RED],
      ['P1 and P3 did not fail', GREEN]
    ]),
    ...say('TEN HOURS LATER: ONLY P2 FAILS', WHITE)
  );

  await until(S(9));
  await play(
    ...fadeIn(threeOutcomes),
    ...fbox([
      ['diamond = actual failure', RED],
      ['circle = no failure', GREEN]
    ]),
    ...say('MARK THE ACTUAL OUTCOMES')
  );

  // ------------------------------------------------------------
  // 10: Introduce distance between a predicted probability
  // and a recorded outcome.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...indicate(
      [
        threeChances[0],
        threeChances[1],
        threeChances[2]
      ],
      BLUE
    ),
    ...fbox([
      ['predicted chance', BLUE],
      'compared with',
      ['recorded outcome', WHITE],
      ['how far apart?', AMBER]
    ], AMBER),
    ...say('MEASURE HOW FAR EACH PREDICTION IS FROM REALITY', AMBER)
  );

  // ------------------------------------------------------------
  // Probability number line.
  //
  // The line has a fixed physical width of 3 units.
  // A probability difference of d is drawn as length 3d.
  //
  // Every error square uses that same scale on both sides,
  // so its area is proportional to the actual squared error.
  // ------------------------------------------------------------

  const SCALE = 4.0;

  const AXIS_X0 = CX - SCALE / 2;
  const AXIS_X1 = CX + SCALE / 2;

  const AXIS_Y = P ? 0.66 : 0.62;

  const xFor = p =>
    AXIS_X0 + p * SCALE;

  const axisLine = line(
    AXIS_X0,
    AXIS_Y,
    AXIS_X1,
    AXIS_Y,
    WHITE,
    3
  );

  const tickValues = [
    0, 0.2, 0.4, 0.6, 0.8, 1
  ];

  const axisTicks = tickValues.map(v =>
    line(
      xFor(v),
      AXIS_Y - 0.065,
      xFor(v),
      AXIS_Y + 0.065,
      C.muted,
      1.6
    )
  );

  const percentLabels = tickValues.map(v =>
    text(
      `${Math.round(v * 100)}%`,
      P ? 16 : 14,
      WHITE,
      xFor(v),
      AXIS_Y - 0.23,
      true,
      0.58
    )
  );

  const decimalLabels = tickValues.map(v =>
    text(
      v === 0 || v === 1
        ? String(v)
        : fmt(v, 1),
      16,
      WHITE,
      xFor(v),
      AXIS_Y - 0.23,
      true,
      0.48
    )
  );

  const leftMeaning = text(
    'No chance of failure',
    16,
    GREEN,
    CX - 2.20,
    AXIS_Y - 0.85,
    false,
    2.70
  );

  const rightMeaning = text(
    'Certain failure',
    16,
    RED,
    CX + 2.20,
    AXIS_Y - 0.85,
    false,
    2.70
  );

  const leftEndpointLeader = line(
    AXIS_X0,
    AXIS_Y - 0.39,
    CX - 2.20,
    AXIS_Y - 0.66,
    GREEN,
    1.4
  );

  const rightEndpointLeader = line(
    AXIS_X1,
    AXIS_Y - 0.39,
    CX + 2.20,
    AXIS_Y - 0.66,
    RED,
    1.4
  );

  // ------------------------------------------------------------
  // 11: Introduce the percentage number line.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...fadeOut([
      ...threeCards,
      ...threeChances,
      ...threeOutcomes,
      ...threeOutcomeLabels
    ]),
    ...clearBox(),
    new M.Create(axisLine),
    ...fadeIn(axisTicks),
    ...fadeIn(percentLabels),
    ...say('A NUMBER LINE FROM 0% TO 100%')
  );

  // ------------------------------------------------------------
  // 12: Explain the two endpoints.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    new M.FadeIn(leftMeaning),
    new M.FadeIn(rightMeaning),
    new M.Create(leftEndpointLeader),
    new M.Create(rightEndpointLeader),
    ...say('0% = IMPOSSIBLE · 100% = CERTAIN')
  );

  // ------------------------------------------------------------
  // 13: Convert percentage labels into decimals.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...fadeOut(percentLabels),
    ...fadeIn(decimalLabels),
    ...fbox([
      ['probability as a number', BLUE],
      'percentage ÷ 100',
      'between 0 and 1'
    ], BLUE),
    ...say('WRITE CHANCES AS NUMBERS BETWEEN 0 AND 1', BLUE)
  );

  // ------------------------------------------------------------
  // 14: Zero and one are the same scale endpoints.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    ...indicate([
      decimalLabels[0],
      decimalLabels[5]
    ], WHITE),
    ...fbox([
      '0% ÷ 100 = 0',
      '100% ÷ 100 = 1'
    ]),
    ...say('0 MEANS 0% · 1 MEANS 100%')
  );

  // ------------------------------------------------------------
  // 15: Show 60% and 90% as blue prediction markers.
  // ------------------------------------------------------------

  function predictionMarker(
    p,
    label = null,
    labelOffset = 0
  ) {
    const x = xFor(p);

    const halo = circle(
      x,
      AXIS_Y,
      0.15,
      BLUE,
      0.18,
      1
    );

    const dot = new M.Dot({
      point: [x, AXIS_Y, 0],
      radius: 0.075,
      color: BLUE
    });

    const leader = line(
      x,
      AXIS_Y + 0.08,
      x,
      AXIS_Y + 0.25,
      BLUE,
      1.6
    );

    const lab = text(
      label || fmt(p, 1),
      17,
      BLUE,
      x + labelOffset,
      AXIS_Y + 0.39,
      true,
      1.30
    );

    return new M.VGroup(
      halo,
      dot,
      leader,
      lab
    );
  }

  const prediction60 = predictionMarker(
    0.6,
    '0.6'
  );

  const prediction90 = predictionMarker(
    0.9,
    '0.9',
    0.10
  );

  await until(S(15));
  await play(
    new M.FadeIn(prediction60),
    new M.FadeIn(prediction90),
    ...fbox([
      ['60% = 0.6', BLUE],
      ['90% = 0.9', BLUE]
    ], BLUE),
    ...say('60% BECOMES 0.6 · 90% BECOMES 0.9', BLUE)
  );

  // ------------------------------------------------------------
  // 16–19: Encode recorded outcomes using the endpoints.
  //
  // 1 = failure.
  // 0 = no failure.
  //
  // These are outcome codes, not forecasts that were known
  // before the ten-hour period ended.
  // ------------------------------------------------------------

  function actualMarker(y, withLabel = true) {
    const x = xFor(y);

    const marker = y === 1
      ? failureIcon(
          x,
          AXIS_Y,
          1.10
        )
      : safeIcon(
          x,
          AXIS_Y,
          1.10
        );

    const objects = [marker];

    if (withLabel) {
      objects.push(
        text(
          y === 1
            ? 'Actual = 1'
            : 'Actual = 0',
          16,
          WHITE,
          x,
          AXIS_Y + 0.42,
          true,
          1.80
        )
      );
    }

    return new M.VGroup(
      ...objects
    );
  }

  const actualZero = actualMarker(0);
  const actualOne = actualMarker(1);

  await until(S(16));
  await play(
    ...fadeOut([
      prediction60,
      prediction90,
      leftMeaning,
      rightMeaning,
      leftEndpointLeader,
      rightEndpointLeader
    ]),
    ...fbox([
      ['recorded outcomes', WHITE],
      'use only the two endpoints'
    ]),
    ...say('USE THE ENDPOINTS TO RECORD WHAT HAPPENED')
  );

  await until(S(17));
  await play(
    new M.FadeIn(actualOne),
    ...fbox([
      ['failure happened', RED],
      ['record outcome = 1', WHITE]
    ], RED),
    ...say('ACTUAL FAILURE → 1', RED)
  );

  await until(S(18));
  await play(
    new M.FadeIn(actualZero),
    ...fbox([
      ['failure did not happen', GREEN],
      ['record outcome = 0', WHITE]
    ], GREEN),
    ...say('NO ACTUAL FAILURE → 0', GREEN)
  );

  const outcomeTimingNote = text(
    'Recorded afterwards, not known beforehand',
    18,
    WHITE,
    CX,
    P ? -1.03 : -0.96,
    false,
    6.60
  );

  await until(S(19));
  await play(
    new M.FadeIn(outcomeTimingNote),
    ...fbox([
      ['prediction: before', BLUE],
      ['outcome: afterwards', WHITE],
      'two different kinds of information'
    ]),
    ...say('0 AND 1 RECORD WHAT ACTUALLY HAPPENED')
  );

  // ------------------------------------------------------------
  // Worked example helpers.
  //
  // The blue marker represents the prediction.
  // The actual outcome uses the fixed diamond/circle language.
  //
  // The amber distance bar lies exactly between the prediction
  // and outcome positions.
  //
  // Squaring transforms the distance bar into a violet square
  // whose width and height are both equal to the gap length.
  // ------------------------------------------------------------

  const GAP_TOP = AXIS_Y - 0.55;
  const GAP_HEIGHT = 0.10;

  const EXAMPLE_CARD_X = CX - (P ? 3.2 : 2.75);
  const EXAMPLE_CARD_Y = P ? -1.68 : -1.28;

  function exampleCard(i) {
    return completeCard(
      i,
      EXAMPLE_CARD_X,
      EXAMPLE_CARD_Y,
      1.12,
      DATA[i].prob,
      true
    );
  }

  function exampleTitle(i) {
    return text(
      `PUMP ${DATA[i].id.slice(1)}`,
      18,
      C.ink,
      EXAMPLE_CARD_X,
      EXAMPLE_CARD_Y + 0.86,
      true,
      1.35
    );
  }

  let exampleIndex = null;
  let examplePrediction = null;
  let exampleActual = null;
  let exampleGap = null;
  let exampleGapText = null;
  let exampleSquare = null;
  let exampleSquareLabels = [];

  function clearExample() {
    const anims = [
      ...clear('example-card'),
      ...fadeOut([
        examplePrediction,
        exampleActual,
        exampleGap,
        exampleGapText,
        exampleSquare,
        ...exampleSquareLabels
      ])
    ];

    exampleIndex = null;
    examplePrediction = null;
    exampleActual = null;
    exampleGap = null;
    exampleGapText = null;
    exampleSquare = null;
    exampleSquareLabels = [];

    return anims;
  }

  function startExample(i) {
    const old = clearExample();

    exampleIndex = i;

    const d = DATA[i];

    examplePrediction = predictionMarker(
      d.p,
      `p = ${fmt(d.p, 1)}`,
      d.p > 0.8 ? -0.10 : 0
    );

    const incompleteCard = new M.VGroup(
      cardBase(
        d.id,
        EXAMPLE_CARD_X,
        EXAMPLE_CARD_Y,
        1.12
      ),
      chanceLabel(
        d.prob,
        EXAMPLE_CARD_X,
        EXAMPLE_CARD_Y,
        1.12,
        true
      )
    );

    return [
      ...old,
      ...replace('example-card', [
        incompleteCard,
        exampleTitle(i)
      ]),
      new M.FadeIn(examplePrediction)
    ];
  }

  function revealExampleOutcome() {
    const d = DATA[exampleIndex];

    exampleActual = actualMarker(d.y);

    const cardOutcome = outcomeMark(
      d.failed,
      EXAMPLE_CARD_X,
      EXAMPLE_CARD_Y,
      1.12
    );

    return [
      ...replace('example-outcome', [
        cardOutcome
      ]),
      new M.FadeIn(exampleActual)
    ];
  }

  function gapGeometry(i) {
    const d = DATA[i];

    const x1 = xFor(d.p);
    const x2 = xFor(d.y);

    return {
      left: Math.min(x1, x2),
      right: Math.max(x1, x2),
      center: (x1 + x2) / 2,
      width: Math.abs(x1 - x2)
    };
  }

  function makeGapBar(i) {
    const g = gapGeometry(i);

    return rect(
      g.center,
      GAP_TOP - GAP_HEIGHT / 2,
      g.width,
      GAP_HEIGHT,
      AMBER,
      0.90,
      2
    );
  }

  function makeGapLabel(i) {
    const d = DATA[i];
    const g = gapGeometry(i);

    return text(
      `Gap = ${fmt(d.gap, 1)}`,
      17,
      AMBER,
      g.center,
      GAP_TOP - 0.25,
      true,
      2.0
    );
  }

  function revealGap() {
    exampleGapText = makeGapLabel(
      exampleIndex
    );

    return [
      new M.FadeIn(exampleGapText)
    ];
  }

  function drawGapBar() {
    exampleGap = makeGapBar(
      exampleIndex
    );

    return [
      new M.FadeIn(exampleGap)
    ];
  }

  function makeErrorSquare(
    i,
    x,
    top,
    scale = SCALE
  ) {
    const d = DATA[i];
    const side = d.gap * scale;

    return rect(
      x,
      top - side / 2,
      side,
      side,
      VIOLET,
      0.32,
      2.8
    );
  }

  function squareExample() {
    const i = exampleIndex;
    const d = DATA[i];

    const g = gapGeometry(i);

    const side = d.gap * SCALE;

    const squareTop = GAP_TOP;
    const squareCenterY =
      squareTop - side / 2;

    const target = makeErrorSquare(
      i,
      g.center,
      squareTop
    );

    const anims = [];

    if (exampleGapText) {
      anims.push(
        new M.FadeOut(exampleGapText)
      );

      exampleGapText = null;
    }

    if (exampleGap) {
      // The original distance bar becomes the square.
      // Its width is preserved exactly.
      anims.push(
        new M.Transform(
          exampleGap,
          target
        )
      );

      exampleSquare = exampleGap;
      exampleGap = null;
    } else {
      exampleSquare = target;

      anims.push(
        new M.FadeIn(exampleSquare)
      );
    }

    const area = text(
      fmt(d.squared),
      24,
      VIOLET,
      g.center,
      squareCenterY,
      true,
      Math.max(0.55, side - 0.16)
    );

    const widthLabel = text(
      fmt(d.gap, 1),
      15,
      AMBER,
      g.center,
      squareTop - 0.14,
      true,
      side - 0.10
    );

    const heightLabel = text(
      fmt(d.gap, 1),
      15,
      AMBER,
      g.right + 0.24,
      squareCenterY,
      true,
      0.55
    );

    exampleSquareLabels = [
      area,
      widthLabel,
      heightLabel
    ];

    anims.push(
      ...fadeIn(exampleSquareLabels)
    );

    return anims;
  }

  // ------------------------------------------------------------
  // 20–26: Pump 2.
  //
  // Predicted probability = 0.6.
  // Actual outcome = 1.
  //
  // Absolute gap = 0.4.
  // Squared error = 0.16.
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    ...fadeOut([
      actualZero,
      actualOne,
      outcomeTimingNote
    ]),
    ...startExample(1),
    ...fbox([
      ['P2', WHITE],
      ['predicted probability = 0.6', BLUE]
    ], BLUE),
    ...say('P2: START AT THE PREDICTED 0.6', BLUE)
  );

  await until(S(21));
  await play(
    ...revealExampleOutcome(),
    ...fbox([
      ['prediction = 0.6', BLUE],
      ['actual outcome = 1', WHITE]
    ]),
    ...say('P2 FAILED: ITS OUTCOME IS 1', RED)
  );

  await until(S(22));
  await play(
    ...revealGap(),
    ...fbox([
      '1 − 0.6',
      ['= 0.4', AMBER]
    ], AMBER),
    ...say('THE DISTANCE FROM 0.6 TO 1 IS 0.4', AMBER)
  );

  await until(S(23));
  await play(
    ...drawGapBar(),
    ...say('DRAW A BAR ACROSS THE GAP', AMBER)
  );

  await until(S(24));
  await play(
    ...indicate(
      [exampleGap],
      AMBER
    ),
    ...fbox([
      ['remember squared error?', VIOLET],
      'turn a distance bar',
      'into a square'
    ], VIOLET),
    ...say('LARGER MISTAKES RECEIVE MORE WEIGHT', VIOLET)
  );

  await until(S(25));
  await play(
    ...squareExample(),
    ...fbox([
      ['square the gap', VIOLET],
      'gap × gap',
      '0.4 × 0.4'
    ], VIOLET),
    ...say('MULTIPLY THE GAP BY ITSELF', VIOLET)
  );

  await until(S(26));
  await play(
    ...indicate(
      [exampleSquare],
      VIOLET
    ),
    ...fbox([
      ['P2 squared error', VIOLET],
      '(0.6 − 1)²',
      '= 0.4 × 0.4',
      ['= 0.16', VIOLET]
    ], VIOLET),
    ...say('P2: SQUARED ERROR = 0.16', VIOLET)
  );

  // ------------------------------------------------------------
  // 27–30: Pump 3.
  //
  // Predicted probability = 0.6.
  // Actual outcome = 0.
  //
  // Absolute gap = 0.6.
  // Squared error = 0.36.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...clear('example-outcome'),
    ...startExample(2),
    ...fbox([
      ['P3', WHITE],
      ['predicted probability = 0.6', BLUE]
    ], BLUE),
    ...say('P3 HAS THE SAME PREDICTED CHANCE', BLUE)
  );

  await until(S(28));
  await play(
    ...revealExampleOutcome(),
    ...fbox([
      ['prediction = 0.6', BLUE],
      ['actual outcome = 0', WHITE]
    ]),
    ...say('P3 DOES NOT FAIL: OUTCOME = 0', GREEN)
  );

  await until(S(29));
  await play(
    ...revealGap(),
    ...drawGapBar(),
    ...fbox([
      '0.6 − 0',
      ['gap = 0.6', AMBER]
    ], AMBER),
    ...say('P3: THE GAP IS 0.6', AMBER)
  );

  await until(S(30));
  await play(
    ...squareExample(),
    ...fbox([
      ['P3 squared error', VIOLET],
      '(0.6 − 0)²',
      '= 0.6 × 0.6',
      ['= 0.36', VIOLET]
    ], VIOLET),
    ...say('P3: SQUARED ERROR = 0.36', VIOLET)
  );

  // ------------------------------------------------------------
  // 31–34: Pump 1.
  //
  // Predicted probability = 0.9.
  // Actual outcome = 0.
  //
  // Absolute gap = 0.9.
  // Squared error = 0.81.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    ...clear('example-outcome'),
    ...startExample(0),
    ...fbox([
      ['P1', WHITE],
      ['predicted probability = 0.9', BLUE]
    ], BLUE),
    ...say('P1: A MORE CONFIDENT PREDICTION OF 0.9', BLUE)
  );

  await until(S(32));
  await play(
    ...revealExampleOutcome(),
    ...fbox([
      ['prediction = 0.9', BLUE],
      ['actual outcome = 0', WHITE]
    ]),
    ...say('P1 DOES NOT FAIL EITHER', GREEN)
  );

  await until(S(33));
  await play(
    ...revealGap(),
    ...drawGapBar(),
    ...fbox([
      '0.9 − 0',
      ['gap = 0.9', AMBER]
    ], AMBER),
    ...say('P1: THE GAP IS 0.9', AMBER)
  );

  await until(S(34));
  await play(
    ...squareExample(),
    ...fbox([
      ['P1 squared error', VIOLET],
      '(0.9 − 0)²',
      '= 0.9 × 0.9',
      ['= 0.81', VIOLET]
    ], VIOLET),
    ...say('P1: SQUARED ERROR = 0.81', VIOLET)
  );

  // ------------------------------------------------------------
  // 35–36: Compare the three squares.
  //
  // All three squares use the same scale:
  //
  // P2 side = 3 × 0.4 = 1.2
  // P3 side = 3 × 0.6 = 1.8
  // P1 side = 3 × 0.9 = 2.7
  //
  // Their areas are proportional to 0.16, 0.36 and 0.81.
  // Do not scale the squares independently to fit their labels.
  // ------------------------------------------------------------

  const COMPARE_IDS = [1, 2, 0];

  const COMPARE_BOTTOM = P
    ? -2.45
    : -2.02;

  const COMPARE_GAP = 0.30;

  const compareTotalWidth =
    COMPARE_IDS.reduce(
      (s, i) => s + DATA[i].gap * SCALE,
      0
    ) +
    (COMPARE_IDS.length - 1) *
    COMPARE_GAP;

  let compareCursor =
    CX - compareTotalWidth / 2;

  const comparisonSquares = [];
  const comparisonLabels = [];

  for (const i of COMPARE_IDS) {
    const d = DATA[i];

    const side = d.gap * SCALE;

    const x =
      compareCursor + side / 2;

    const top =
      COMPARE_BOTTOM + side;

    const square = makeErrorSquare(
      i,
      x,
      top
    );

    const area = text(
      fmt(d.squared),
      25,
      VIOLET,
      x,
      COMPARE_BOTTOM + side / 2,
      true,
      side - 0.15
    );

    const name = text(
      d.id,
      19,
      WHITE,
      x,
      COMPARE_BOTTOM - 0.25,
      true
    );

    const dimensions = text(
      `${fmt(d.gap, 1)} × ${fmt(d.gap, 1)}`,
      P ? 16 : 14,
      AMBER,
      x,
      COMPARE_BOTTOM - 0.52,
      true,
      side + 0.12
    );

    comparisonSquares.push(square);

    comparisonLabels.push(
      area,
      name,
      dimensions
    );

    compareCursor +=
      side + COMPARE_GAP;
  }

  const compareFloor = line(
    CX - compareTotalWidth / 2 - 0.13,
    COMPARE_BOTTOM,
    CX + compareTotalWidth / 2 + 0.13,
    COMPARE_BOTTOM,
    C.muted,
    1.6
  );

  const compareHeading = text(
    'SQUARED PREDICTION ERRORS',
    18,
    VIOLET,
    CX,
    P ? 1.35 : 1.33,
    true,
    6.60
  );

  await until(S(35));
  await play(
    ...clear('example-outcome'),
    ...clearExample(),
    ...fadeOut([
      axisLine,
      ...axisTicks,
      ...decimalLabels
    ]),
    new M.FadeIn(compareHeading),
    new M.Create(compareFloor),
    lag(
      fadeIn(comparisonSquares),
      1.65,
      0.25
    ),
    ...fadeIn(comparisonLabels),
    ...fbox([
      ['P2: 0.16', VIOLET],
      ['P3: 0.36', VIOLET],
      ['P1: 0.81', VIOLET]
    ], VIOLET),
    ...say('COMPARE THE AREAS OF THE THREE SQUARES', VIOLET)
  );

  await until(S(36));
  await play(
    new M.Indicate(
      comparisonSquares[2],
      {
        color: AMBER,
        runTime: 1.20
      }
    ),
    ...fbox([
      ['P1 predicted 90%', BLUE],
      ['but the pump survived', GREEN],
      ['largest penalty = 0.81', VIOLET]
    ], VIOLET),
    ...say('P1 RECEIVES THE LARGEST PENALTY', AMBER)
  );

  // ------------------------------------------------------------
  // Twelve-card calculation grid.
  //
  // Each card carries:
  //   - pump identity and icon;
  //   - predicted probability;
  //   - actual outcome symbol;
  //   - a small proportional error square;
  //   - the numerical squared error.
  //
  // All miniature squares use one shared scale.
  // ------------------------------------------------------------

  const GRID_SCALE = P ? 0.93 : 0.82;

  const GRID_SPX = P ? 1.56 : 1.60;
  const GRID_SPY = P ? 1.67 : 1.27;

  const GRID_TOP = P ? 1.17 : 0.94;

  const MINI_SQUARE_SCALE = P
    ? 0.48
    : 0.38;

  function gridPosition(i) {
    return [
      CX + (i % 4 - 1.5) * GRID_SPX,
      GRID_TOP -
        Math.floor(i / 4) * GRID_SPY,
      0
    ];
  }

  function gridCard(i, forecast = DATA[i].prob) {
    const p = gridPosition(i);

    return completeCard(
      i,
      p[0],
      p[1],
      GRID_SCALE,
      forecast,
      true
    );
  }

  function miniaturePenalty(
    i,
    probability = DATA[i].p
  ) {
    const d = DATA[i];
    const p = gridPosition(i);

    const gap = Math.abs(
      probability - d.y
    );

    const loss = gap ** 2;

    const side =
      gap * MINI_SQUARE_SCALE;

    const y =
      p[1] - CARD_H * GRID_SCALE / 2 -
      (P ? 0.28 : 0.20);

    const objects = [];

    if (side > 0) {
      objects.push(
        rect(
          p[0] - 0.36,
          y,
          side,
          side,
          VIOLET,
          0.42,
          1.8
        )
      );
    }

    objects.push(
      text(
        fmt(loss),
        P ? 17 : 15,
        VIOLET,
        p[0] + 0.19,
        y,
        true,
        0.78
      )
    );

    return new M.VGroup(
      ...objects
    );
  }

  const gridCards = IDS.map(i =>
    gridCard(i)
  );

  const gridPenalties = IDS.map(i =>
    miniaturePenalty(i)
  );

  const KNOWN_IDS = [0, 1, 2];

  const REMAINING_IDS = IDS.filter(i =>
    !KNOWN_IDS.includes(i)
  );

  // ------------------------------------------------------------
  // 37: Bring back all twelve pump cards.
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...fadeOut([
      compareHeading,
      compareFloor,
      ...comparisonSquares,
      ...comparisonLabels
    ]),
    ...clearBox(),
    lag(
      fadeIn(gridCards),
      1.05,
      0.06
    ),
    ...fadeIn(
      KNOWN_IDS.map(i =>
        gridPenalties[i]
      )
    ),
    ...say('RETURN TO ALL TWELVE PUMPS')
  );

  // ------------------------------------------------------------
  // 38: Calculate the remaining nine squared errors.
  //
  // Reveal each new miniature square and its exact value.
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    lag(
      fadeIn(
        REMAINING_IDS.map(i =>
          gridPenalties[i]
        )
      ),
      2.60,
      0.10
    ),
    ...fbox([
      ['P4: (0.3 − 1)² = 0.49', VIOLET],
      ['P5/P6: 0.3² = 0.09', VIOLET],
      ['P7–P12: 0.1² = 0.01', VIOLET]
    ], VIOLET),
    ...say('SQUARE THE GAPS FOR THE OTHER NINE PUMPS', VIOLET)
  );

  // ------------------------------------------------------------
  // 39: Collect all twelve squared errors.
  //
  // Use equal-width numerical tiles so values are easy to
  // read. This is a sum of areas, not a sum of square sides.
  // ------------------------------------------------------------

  const TILE_W = 1.32;
  const TILE_H = P ? 0.84 : 0.72;

  const TILE_SPX = 1.55;
  const TILE_SPY = P ? 1.07 : 0.87;

  const TILE_TOP = P ? 0.92 : 0.94;

  function sumTile(i) {
    const row = Math.floor(i / 4);
    const col = i % 4;

    const x =
      CX + (col - 1.5) * TILE_SPX;

    const y =
      TILE_TOP - row * TILE_SPY;

    const frame = rounded(
      x,
      y,
      TILE_W,
      TILE_H,
      VIOLET,
      VIOLET,
      0.09,
      1.8,
      0.09
    );

    const id = text(
      DATA[i].id,
      P ? 16 : 14,
      WHITE,
      x,
      y + TILE_H * 0.25,
      true
    );

    const value = text(
      fmt(DATA[i].squared),
      21,
      VIOLET,
      x,
      y - TILE_H * 0.16,
      true
    );

    return new M.VGroup(
      frame,
      id,
      value
    );
  }

  const sumTiles = IDS.map(sumTile);

  const totalText = text(
    `TOTAL = ${fmt(SUM)}`,
    28,
    VIOLET,
    CX,
    P ? -2.78 : -2.08,
    true
  );

  const totalLine = line(
    CX - 2.95,
    P ? -2.30 : -1.69,
    CX + 2.95,
    P ? -2.30 : -1.69,
    VIOLET,
    2.5
  );

  await until(S(39));
  await play(
    ...fadeOut(gridCards),
    ...fadeOut(gridPenalties),
    lag(fadeIn(sumTiles), 1.2, 0.06),
    new M.Create(totalLine),
    new M.FadeIn(totalText),
    ...fbox([
      '0.81 + 0.16 + 0.36',
      '+ 0.49 + 0.09 + 0.09',
      '+ 6 × 0.01',
      ['= 2.06', VIOLET]
    ], VIOLET),
    ...say('ADD ALL TWELVE SQUARED ERRORS: 2.06', VIOLET)
  );

  // ------------------------------------------------------------
  // 40: Divide by the number of predictions.
  // ------------------------------------------------------------

  const meanText = text(
    `2.06 ÷ 12 ≈ ${fmt(BRIER, 3)}`,
    28,
    VIOLET,
    CX,
    P ? -3.45 : -2.62,
    true,
    6.50
  );

  await until(S(40));
  await play(
    new M.FadeIn(meanText),
    ...fbox([
      ['total squared error = 2.06', VIOLET],
      'number of predictions = 12',
      ['2.06 ÷ 12 ≈ 0.172', VIOLET]
    ], VIOLET),
    ...say('DIVIDE THE TOTAL BY TWELVE')
  );

  // ------------------------------------------------------------
  // 41: Name the Brier score.
  // ------------------------------------------------------------

  const brierName = pill(
    'BRIER SCORE ≈ 0.172',
    VIOLET,
    22
  );

  brierName.moveTo([
    CX,
    P ? -4.23 : -2.62,
    0
  ]);

  await until(S(41));
  await play(
    new M.FadeOut(meanText),
    new M.FadeIn(brierName),
    ...fbox([
      ['BRIER SCORE', VIOLET],
      'mean squared difference',
      'between predicted chances',
      'and recorded outcomes'
    ], VIOLET),
    ...say('THIS MEAN IS CALLED THE BRIER SCORE', VIOLET)
  );

  // ------------------------------------------------------------
  // 42–45: Introduce the formula after the visual calculation.
  //
  // For a binary event:
  //
  // Brier score = (1/n) × sum[(p_i − y_i)²]
  //
  // p_i: predicted probability of failure.
  // y_i: actual outcome, either 0 or 1.
  //
  // This is the binary-event convention used throughout
  // this chapter.
  // ------------------------------------------------------------

  const FORMULA_W = P ? 6.60 : 6.75;
  const FORMULA_H = P ? 4.20 : 3.72;

  const FORMULA_Y = P ? -1.02 : -0.66;

  const formulaFrame = rounded(
    CX,
    FORMULA_Y,
    FORMULA_W,
    FORMULA_H,
    VIOLET,
    C.card,
    0.92,
    2,
    0.18
  );

  const formulaTitle = text(
    'BRIER SCORE',
    23,
    VIOLET,
    CX,
    FORMULA_Y + FORMULA_H / 2 - 0.32,
    true
  );

  const formulaRule = line(
    CX - FORMULA_W / 2 + 0.35,
    FORMULA_Y + FORMULA_H / 2 - 0.60,
    CX + FORMULA_W / 2 - 0.35,
    FORMULA_Y + FORMULA_H / 2 - 0.60,
    C.muted,
    1.4
  );

  const subtractY =
    FORMULA_Y + 0.66;

  const squareY =
    FORMULA_Y + 0.03;

  const averageY =
    FORMULA_Y - 0.66;

  const subtractFormula = text(
    'Probability − outcome',
    23,
    WHITE,
    CX,
    subtractY,
    true,
    FORMULA_W - 0.45
  );

  const subtractExample = text(
    'P2: 0.6 − 1 = −0.4',
    19,
    AMBER,
    CX,
    subtractY - 0.36,
    true,
    FORMULA_W - 0.45
  );

  const squareFormula = text(
    '(Probability − outcome)²',
    23,
    VIOLET,
    CX,
    squareY - 0.12,
    true,
    FORMULA_W - 0.45
  );

  const squareExampleText = text(
    '(−0.4) × (−0.4) = 0.16',
    19,
    VIOLET,
    CX,
    squareY - 0.50,
    true,
    FORMULA_W - 0.45
  );

  const finalFormulaLine = line(
    CX - FORMULA_W / 2 + 0.60,
    averageY - 0.17,
    CX + FORMULA_W / 2 - 0.60,
    averageY - 0.17,
    WHITE,
    2.0
  );

  const finalNumerator = text(
    'Sum of all squared differences',
    19,
    VIOLET,
    CX,
    averageY + 0.11,
    true,
    FORMULA_W - 0.75
  );

  const finalDenominator = text(
    'Number of predictions',
    19,
    WHITE,
    CX,
    averageY - 0.43,
    true,
    FORMULA_W - 0.75
  );

  await until(S(42));
  await play(
    ...fadeOut([
      ...sumTiles,
      totalText,
      totalLine,
      brierName
    ]),
    ...clearBox(),
    ...fadeIn([
      formulaFrame,
      formulaTitle,
      formulaRule
    ]),
    ...say('NOW WRITE THE CALCULATION AS A FORMULA')
  );

  await until(S(43));
  await play(
    new M.FadeIn(subtractFormula),
    new M.FadeIn(subtractExample),
    ...fbox([
      ['p = predicted probability', BLUE],
      ['y = actual outcome, 0 or 1', WHITE],
      'difference = p − y'
    ]),
    ...say('SUBTRACT THE RECORDED OUTCOME FROM THE CHANCE')
  );

  await until(S(44));
  await play(
    new M.FadeIn(squareFormula),
    new M.FadeIn(squareExampleText),
    ...fbox([
      ['squared error', VIOLET],
      '(p − y) × (p − y)',
      ['= (p − y)²', VIOLET]
    ], VIOLET),
    ...say('MULTIPLY THE DIFFERENCE BY ITSELF', VIOLET)
  );

  await until(S(45));
  await play(
    new M.FadeOut(subtractFormula),
    new M.FadeOut(subtractExample),
    new M.FadeOut(squareFormula),
    new M.FadeOut(squareExampleText),
    new M.FadeIn(finalNumerator),
    new M.Create(finalFormulaLine),
    new M.FadeIn(finalDenominator),
    ...replace('symbolic-formula', [
      text(
        'Brier = Σ(pᵢ − yᵢ)² / n',
        25,
        VIOLET,
        CX,
        FORMULA_Y + 0.48,
        true,
        FORMULA_W - 0.45
      ),
      text(
        'Here: 2.06 / 12 ≈ 0.172',
        22,
        WHITE,
        CX,
        FORMULA_Y - 0.04,
        true,
        FORMULA_W - 0.45
      )
    ]),
    ...fbox([
      ['Brier score', VIOLET],
      'sum of squared errors',
      '÷ number of predictions'
    ], VIOLET),
    ...say('ADD THE SQUARED ERRORS AND DIVIDE BY THE COUNT')
  );

  // ------------------------------------------------------------
  // Score bounds.
  //
  // Because 0 <= p <= 1 and y is either 0 or 1:
  //
  // 0 <= (p − y)² <= 1.
  //
  // Therefore the mean also lies between 0 and 1.
  //
  // Perfect forecast: p = y, so loss = 0.
  // Completely wrong certainty: p = 1 − y, so loss = 1.
  // ------------------------------------------------------------

  const BOUND_X0 = CX - 2.70;
  const BOUND_X1 = CX + 2.70;

  const BOUND_Y = P ? -2.85 : -2.28;

  const boundX = v =>
    BOUND_X0 + v *
    (BOUND_X1 - BOUND_X0);

  const boundsAxis = line(
    BOUND_X0,
    BOUND_Y,
    BOUND_X1,
    BOUND_Y,
    C.muted,
    3
  );

  const boundsTicks = [0, 0.25, 0.5, 0.75, 1].flatMap(v => [
    line(
      boundX(v),
      BOUND_Y - 0.065,
      boundX(v),
      BOUND_Y + 0.065,
      C.muted,
      1.5
    ),

    text(
      String(v),
      P ? 16 : 14,
      WHITE,
      boundX(v),
      BOUND_Y - 0.23,
      true
    )
  ]);

  function boundCase(
    x,
    p,
    y,
    caption,
    color
  ) {
    const centerY = P
      ? -0.72
      : -0.52;

    const w = 2.80;
    const h = P ? 2.70 : 2.40;

    const frame = rounded(
      x,
      centerY,
      w,
      h,
      color,
      C.card,
      0.94,
      2,
      0.14
    );

    const title = text(
      caption,
      17,
      color,
      x,
      centerY + h / 2 - 0.25,
      true,
      w - 0.24
    );

    const predicted = text(
      `p = ${p}`,
      22,
      BLUE,
      x,
      centerY + 0.44,
      true
    );

    const actual = text(
      `y = ${y}`,
      22,
      WHITE,
      x,
      centerY + 0.02,
      true
    );

    const outcome = y === 1
      ? failureIcon(
          x + 0.76,
          centerY + 0.02,
          0.82
        )
      : safeIcon(
          x + 0.76,
          centerY + 0.02,
          0.82
        );

    const result = text(
      `(${p} − ${y})² = ${(p - y) ** 2}`,
      20,
      VIOLET,
      x,
      centerY - 0.52,
      true,
      w - 0.22
    );

    return new M.VGroup(
      frame,
      title,
      predicted,
      actual,
      outcome,
      result
    );
  }

  const perfectCase = boundCase(
    CX - 1.57,
    1,
    1,
    'PERFECT MATCH',
    GREEN
  );

  const wrongCase = boundCase(
    CX + 1.57,
    1,
    0,
    'WRONG CERTAINTY',
    RED
  );

  const bestPoint = circle(
    BOUND_X0,
    BOUND_Y,
    0.10,
    GREEN,
    1,
    2
  );

  const worstPoint = circle(
    BOUND_X1,
    BOUND_Y,
    0.10,
    RED,
    1,
    2
  );

  // ------------------------------------------------------------
  // 46: Smallest possible Brier score = 0.
  // ------------------------------------------------------------

  await until(S(46));
  await play(
    ...fadeOut([
      formulaFrame,
      formulaTitle,
      formulaRule,
      finalNumerator,
      finalFormulaLine,
      finalDenominator
    ]),
    ...clear('symbolic-formula'),
    new M.Create(boundsAxis),
    ...fadeIn(boundsTicks),
    new M.FadeIn(perfectCase),
    new M.FadeIn(bestPoint),
    ...fbox([
      ['perfect prediction', GREEN],
      'p = y',
      '(p − y)² = 0',
      ['best possible Brier = 0', GREEN]
    ], GREEN),
    ...say('SMALLEST POSSIBLE SCORE: ZERO', GREEN)
  );

  // ------------------------------------------------------------
  // 47: Largest possible Brier score = 1.
  // ------------------------------------------------------------

  await until(S(47));
  await play(
    new M.FadeIn(wrongCase),
    new M.FadeIn(worstPoint),
    ...fbox([
      ['complete certainty, wrong outcome', RED],
      'p = 1 − y',
      '(p − y)² = 1',
      ['worst possible Brier = 1', RED]
    ], RED),
    ...say('LARGEST POSSIBLE SCORE: ONE', RED)
  );

  // ------------------------------------------------------------
  // 48: Lower Brier scores indicate better average probability
  // predictions on the same evaluation cases.
  // ------------------------------------------------------------

  const toolScorePoint = circle(
    boundX(BRIER),
    BOUND_Y,
    0.095,
    VIOLET,
    1,
    2
  );

  const toolScoreLabel = text(
    'Tool A ≈ 0.172',
    16,
    VIOLET,
    boundX(BRIER) + 0.40,
    BOUND_Y + 0.36,
    true,
    2.60
  );

  await until(S(48));
  await play(
    new M.FadeIn(toolScorePoint),
    new M.FadeIn(toolScoreLabel),
    ...fbox([
      ['compare probability forecasts', VIOLET],
      'on the same evaluation outcomes',
      ['smaller Brier is better', GREEN]
    ], VIOLET),
    ...say('COMPARE TOOLS: SMALLER BRIER IS BETTER', GREEN)
  );

  // ------------------------------------------------------------
  // 49–51: Constant 50% forecast.
  //
  // Every pump is assigned p = 0.5.
  // Actual outcomes remain unchanged.
  //
  // For a failure:
  //   (0.5 − 1)² = 0.25.
  //
  // For a non-failure:
  //   (0.5 − 0)² = 0.25.
  //
  // All twelve squared errors are identical.
  // Their mean is therefore 0.25.
  // ------------------------------------------------------------

  const reference50Cards = IDS.map(i =>
    gridCard(i, 50)
  );

  const reference50Penalties = IDS.map(i =>
    miniaturePenalty(i, 0.5)
  );

  const reference50Title = text(
    'CONSTANT 50% FORECAST',
    19,
    BLUE,
    CX,
    P ? -3.15 : -2.45,
    true,
    6.5
  );

  await until(S(49));
  await play(
    ...fadeOut([
      perfectCase,
      wrongCase,
      boundsAxis,
      ...boundsTicks,
      bestPoint,
      worstPoint,
      toolScorePoint,
      toolScoreLabel
    ]),
    new M.FadeIn(reference50Title),
    lag(
      fadeIn(reference50Cards),
      1.35,
      0.07
    ),
    ...fbox([
      ['reference forecast', BLUE],
      'predict 0.5 for every pump',
      'regardless of its features'
    ], BLUE),
    ...say('IMAGINE A TOOL THAT ALWAYS PREDICTS 50%', BLUE)
  );

  // ------------------------------------------------------------
  // Two small number lines show why both possible outcomes
  // produce exactly the same absolute gap.
  // ------------------------------------------------------------

  function halfGapDiagram(
    x,
    y,
    outcome
  ) {
    const w = 2.45;

    const x0 = x - w / 2;
    const x1 = x + w / 2;

    const midpoint = x;

    const actualX =
      outcome === 1
        ? x1
        : x0;

    const axis = line(
      x0,
      y,
      x1,
      y,
      WHITE,
      2.5
    );

    const labels = [
      text('0', 14, WHITE, x0, y - 0.21, true),
      text('0.5', 14, BLUE, x, y - 0.21, true),
      text('1', 14, WHITE, x1, y - 0.21, true)
    ];

    const prediction = circle(
      midpoint,
      y,
      0.075,
      BLUE,
      1,
      1.5
    );

    const actual = outcome === 1
      ? failureIcon(
          actualX,
          y,
          0.88
        )
      : safeIcon(
          actualX,
          y,
          0.88
        );

    const left = Math.min(
      midpoint,
      actualX
    );

    const right = Math.max(
      midpoint,
      actualX
    );

    const bar = rect(
      (left + right) / 2,
      y - 0.46,
      right - left,
      0.10,
      AMBER,
      0.90,
      1.5
    );

    const caption = text(
      'Gap = 0.5',
      18,
      AMBER,
      x,
      y - 0.72,
      true
    );

    const heading = text(
      outcome === 1
        ? 'ACTUAL FAILURE'
        : 'NO FAILURE',
      16,
      outcome === 1
        ? RED
        : GREEN,
      x,
      y + 0.34,
      true,
      2.60
    );

    return new M.VGroup(
      axis,
      ...labels,
      prediction,
      actual,
      bar,
      caption,
      heading
    );
  }

  const halfFailure = halfGapDiagram(
    CX - 1.58,
    P ? -0.18 : -0.06,
    1
  );

  const halfSafe = halfGapDiagram(
    CX + 1.58,
    P ? -0.18 : -0.06,
    0
  );

  await until(S(50));
  await play(
    ...fadeOut(reference50Cards),
    new M.FadeOut(reference50Title),
    new M.FadeIn(halfFailure),
    new M.FadeIn(halfSafe),
    ...fbox([
      ['if failure: |0.5 − 1| = 0.5', RED],
      ['if no failure: |0.5 − 0| = 0.5', GREEN],
      'same gap in both cases'
    ], AMBER),
    ...say('EVERY GAP IS 0.5, WHATEVER HAPPENS', AMBER)
  );

  const halfSquareSide = 0.5 * SCALE;

  const halfSquareY = P
    ? -1.95
    : -1.74;

  const halfSquare = rect(
    CX,
    halfSquareY,
    halfSquareSide,
    halfSquareSide,
    VIOLET,
    0.34,
    2.8
  );

  const halfSquareValue = text(
    '0.25',
    26,
    VIOLET,
    CX,
    halfSquareY,
    true
  );

  const halfSquareSideLabel = text(
    '0.5 × 0.5',
    17,
    AMBER,
    CX,
    halfSquareY - halfSquareSide / 2 - 0.24,
    true
  );

  await until(S(51));
  await play(
    new M.FadeIn(halfSquare),
    new M.FadeIn(halfSquareValue),
    new M.FadeIn(halfSquareSideLabel),
    ...fbox([
      ['every squared error = 0.25', VIOLET],
      '12 × 0.25 = 3',
      '3 ÷ 12',
      ['Brier = 0.25', VIOLET]
    ], VIOLET),
    ...say('0.5 × 0.5 = 0.25: THE BRIER SCORE', VIOLET)
  );

  // ------------------------------------------------------------
  // 52: Compare the original model with two reference forecasts.
  //
  // Original Tool A:
  //   2.06 / 12 ≈ 0.172.
  //
  // Constant p = 0.5:
  //   0.25.
  //
  // Constant p = 1/6:
  //   [2 × (1/6 − 1)² + 10 × (1/6 − 0)²] / 12
  //   = 5/36 ≈ 0.139.
  //
  // The 1/6 probability is calculated from the evaluation
  // outcomes themselves. It is explicitly descriptive.
  // Do not describe this as an independently validated model.
  // ------------------------------------------------------------

  const REF_X0 = CX - 2.72;
  const REF_X1 = CX + 2.72;

  // Zoomed comparison axis, explicitly labelled 0–0.30.
  // All three bars use the same numerical scale.
  const REF_MAX = 0.30;

  const REF_W = REF_X1 - REF_X0;

  function referenceBar(
    y,
    value,
    title,
    color,
    valueLabel
  ) {
    const heading = text(
      title,
      17,
      color,
      CX,
      y + 0.35,
      false,
      REF_W
    );

    const track = rounded(
      CX,
      y,
      REF_W,
      0.30,
      C.muted,
      C.card,
      0.40,
      1.3,
      0.06
    );

    const w =
      REF_W * value / REF_MAX;

    const fill = rect(
      REF_X0 + w / 2,
      y,
      w,
      0.30,
      color,
      0.82,
      1
    );

    const valueText = text(
      valueLabel,
      16,
      WHITE,
      Math.min(
        REF_X1 - 0.42,
        REF_X0 + w + 0.45
      ),
      y,
      true,
      0.90
    );

    return new M.VGroup(
      heading,
      track,
      fill,
      valueText
    );
  }

  const ref50Bar = referenceBar(
    P ? 0.97 : 0.99,
    SCORE50,
    'Always predicts 50%',
    AMBER,
    '0.250'
  );

  const refToolBar = referenceBar(
    P ? -0.12 : 0.04,
    BRIER,
    'Tool A',
    BLUE,
    '0.172'
  );

  const refPrevalenceBar = referenceBar(
    P ? -1.21 : -0.91,
    SCORE_PREVALENCE,
    'Constant 1/6 forecast — descriptive',
    VIOLET,
    '0.139'
  );

  const REF_AXIS_Y = P
    ? -1.75
    : -1.42;

  const refTicks = [0, 0.1, 0.2, 0.3].flatMap(v => {
    const x =
      REF_X0 +
      v / REF_MAX * REF_W;

    return [
      line(
        x,
        REF_AXIS_Y - 0.055,
        x,
        REF_AXIS_Y + 0.055,
        C.muted,
        1.5
      ),
      text(
        fmt(v, 1),
        P ? 16 : 14,
        C.muted,
        x,
        REF_AXIS_Y - 0.20,
        true
      )
    ];
  });

  const refAxis = line(
    REF_X0,
    REF_AXIS_Y,
    REF_X1,
    REF_AXIS_Y,
    C.muted,
    1.6
  );

  const referenceWarning = text(
    '1/6 comes from these same twelve outcomes',
    15,
    AMBER,
    CX,
    P ? -2.43 : -2.05,
    false,
    6.65
  );

  const referenceWarning2 = text(
    'Not an independently validated forecast',
    P ? 16 : 14,
    C.muted,
    CX,
    P ? -2.85 : -2.43,
    false,
    6.65
  );

  await until(S(52));
  await play(
    ...fadeOut([
      halfFailure,
      halfSafe,
      halfSquare,
      halfSquareValue,
      halfSquareSideLabel
    ]),
    lag(
      fadeIn([
        ref50Bar,
        refToolBar,
        refPrevalenceBar
      ]),
      2.20,
      0.24
    ),
    new M.Create(refAxis),
    ...fadeIn(refTicks),
    new M.FadeIn(referenceWarning),
    new M.FadeIn(referenceWarning2),
    ...fbox([
      ['Tool A ≈ 0.172', BLUE],
      ['50% reference = 0.250', AMBER],
      ['1/6 reference ≈ 0.139', VIOLET],
      'choose suitable reference forecasts'
    ], VIOLET),
    ...say('BEAT A SUITABLE REFERENCE, NOT JUST A WEAK ONE')
  );

  // ------------------------------------------------------------
  // 53: A single unlikely outcome does not prove a probability
  // forecast was untrustworthy.
  //
  // P1 received a large squared error of 0.81 because it
  // survived despite a 90% predicted failure chance.
  //
  // But a trustworthy 90% failure probability still allows
  // survival with probability 10%.
  //
  // Ten equal probability blocks illustrate the two possible
  // outcomes. They are not ten observed pumps.
  // ------------------------------------------------------------

  const warningCard = completeCard(
    0,
    CX - 2.10,
    P ? 0.05 : -0.12,
    1.55
  );

  const WARNING_X = CX + 1.20;
  const WARNING_Y = P ? 0.05 : -0.12;

  const CHANCE_W = 3.25;
  const CHANCE_GAP = 0.035;

  const CHANCE_BLOCK_W =
    (CHANCE_W - 9 * CHANCE_GAP) / 10;

  const chanceBlocks = Array.from(
    { length: 10 },
    (_, i) => {
      const x =
        WARNING_X - CHANCE_W / 2 +
        CHANCE_BLOCK_W / 2 +
        i * (
          CHANCE_BLOCK_W +
          CHANCE_GAP
        );

      const failureChance = i < 9;

      return new M.VGroup(
        rect(
          x,
          WARNING_Y,
          CHANCE_BLOCK_W,
          0.48,
          failureChance ? RED : GREEN,
          failureChance ? 0.24 : 0.08,
          1.6
        ),

        failureChance
          ? failureIcon(
              x,
              WARNING_Y,
              0.65
            )
          : safeIcon(
              x,
              WARNING_Y,
              0.65
            )
      );
    }
  );

  const chanceTitle = text(
    'POSSIBLE OUTCOMES',
    18,
    WHITE,
    WARNING_X,
    WARNING_Y + 0.56,
    true,
    CHANCE_W
  );

  const chanceFailureText = text(
    '90% chance of failure',
    16,
    RED,
    WARNING_X,
    WARNING_Y - 0.48,
    false,
    CHANCE_W
  );

  const chanceSafeText = text(
    '10% chance of survival',
    16,
    GREEN,
    WARNING_X,
    WARNING_Y - 0.85,
    false,
    CHANCE_W
  );

  const warningPenalty = text(
    'Squared error = 0.81',
    18,
    VIOLET,
    CX - 2.10,
    P ? -1.20 : -1.24,
    true,
    2.75
  );

  const warningCaption = text(
    'A large penalty is possible even for a trustworthy chance',
    18,
    AMBER,
    CX,
    P ? -2.35 : -2.17,
    false,
    6.55
  );

  await until(S(53));
  await play(
    ...fadeOut([
      ref50Bar,
      refToolBar,
      refPrevalenceBar,
      refAxis,
      ...refTicks,
      referenceWarning,
      referenceWarning2
    ]),
    new M.FadeIn(warningCard),
    new M.FadeIn(warningPenalty),
    new M.FadeIn(chanceTitle),
    ...fadeIn(chanceBlocks),
    new M.FadeIn(chanceFailureText),
    new M.FadeIn(chanceSafeText),
    new M.FadeIn(warningCaption),
    ...fbox([
      ['one unlikely outcome', AMBER],
      'does not establish poor calibration',
      'evaluate many predictions'
    ], AMBER),
    ...say('ONE LARGE PENALTY DOES NOT PROVE A CHANCE WRONG', AMBER)
  );

  // ------------------------------------------------------------
  // 54: Final recap.
  //
  // Return to the original fixed twelve-pump data.
  //
  // Display all individual squared probability errors,
  // their total and their mean.
  //
  // Reinforce:
  //   - predictions are probabilities from 0 to 1;
  //   - recorded outcomes are 0 or 1;
  //   - square each difference;
  //   - average across many outcomes;
  //   - smaller Brier is better.
  // ------------------------------------------------------------

  const recapCards = IDS.map(i =>
    gridCard(i)
  );

  const recapPenalties = IDS.map(i =>
    miniaturePenalty(i)
  );

  const recapY = P
    ? -4.18
    : -2.70;

  const recapScore = text(
    'BRIER = 2.06 / 12 ≈ 0.172',
    P ? 26 : 22,
    VIOLET,
    CX,
    recapY,
    true,
    6.65
  );

  const recapNote = text(
    'Smaller is better — evaluate many outcomes',
    17,
    GREEN,
    CX,
    recapY - 0.46,
    false,
    6.60
  );

  await until(S(54));
  await play(
    ...fadeOut([
      warningCard,
      warningPenalty,
      chanceTitle,
      ...chanceBlocks,
      chanceFailureText,
      chanceSafeText,
      warningCaption
    ]),
    lag(
      fadeIn(recapCards),
      1.45,
      0.05
    ),
    ...fadeIn(recapPenalties),
    new M.FadeIn(recapScore),
    ...(P
      ? [new M.FadeIn(recapNote)]
      : []),
    ...fbox([
      ['BRIER SCORE', VIOLET],
      'mean of (probability − outcome)²',
      ['smaller is better', GREEN],
      'evaluate many outcomes'
    ], VIOLET),
    ...say('BRIER SCORE: MEAN SQUARED PROBABILITY ERROR', VIOLET)
  );

  // Hold the completed recap until the narration finishes.
  await until(E(54));
}
