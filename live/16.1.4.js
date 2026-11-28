// lesson 16.1.4
// Shapley attributions: how much does each feature contribute?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Browser playback and narration seeking have not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data — fixed.
  // ------------------------------------------------------------

  const HOMES = ['A', 'B', 'C', 'D'];
  const DISTRICTS = ['North', 'North', 'South', 'South'];
  const CALLS = [2, 0, 2, 0];
  const PIPES = ['Older', 'Newer', 'Newer', 'Older'];
  const ACTUAL = [true, false, true, true];

  const MODEL = {
    Newer: [10, 30, 50],
    Older: [30, 60, 90]
  };

  const predict = (calls, pipe) => MODEL[pipe][calls];

  const ORIGINAL_RISK = HOMES.map((_, i) =>
    predict(CALLS[i], PIPES[i])
  );

  const REFERENCE = {
    calls: 0,
    pipe: 'Newer',
    risk: predict(0, 'Newer')
  };

  const HOME_A = {
    calls: CALLS[0],
    pipe: PIPES[0],
    risk: ORIGINAL_RISK[0]
  };

  // Order 1: change calls first, then pipe type.

  const CALLS_FIRST = [
    {
      calls: 0,
      pipe: 'Newer',
      risk: predict(0, 'Newer')
    },
    {
      calls: 2,
      pipe: 'Newer',
      risk: predict(2, 'Newer')
    },
    {
      calls: 2,
      pipe: 'Older',
      risk: predict(2, 'Older')
    }
  ];

  // Order 2: change pipe type first, then calls.

  const PIPE_FIRST = [
    {
      calls: 0,
      pipe: 'Newer',
      risk: predict(0, 'Newer')
    },
    {
      calls: 0,
      pipe: 'Older',
      risk: predict(0, 'Older')
    },
    {
      calls: 2,
      pipe: 'Older',
      risk: predict(2, 'Older')
    }
  ];

  const CALLS_CONTRIBUTIONS = [
    CALLS_FIRST[1].risk - CALLS_FIRST[0].risk,
    PIPE_FIRST[2].risk - PIPE_FIRST[1].risk
  ];

  const PIPE_CONTRIBUTIONS = [
    CALLS_FIRST[2].risk - CALLS_FIRST[1].risk,
    PIPE_FIRST[1].risk - PIPE_FIRST[0].risk
  ];

  const mean = values =>
    values.reduce((a, b) => a + b, 0) / values.length;

  const CALLS_SHAPLEY = mean(CALLS_CONTRIBUTIONS);
  const PIPE_SHAPLEY = mean(PIPE_CONTRIBUTIONS);

  const TOTAL_INCREASE = HOME_A.risk - REFERENCE.risk;

  // Checked results:
  //
  // Reference: 0 calls, newer pipe, 10% risk.
  // Home A:    2 calls, older pipe, 90% risk.
  //
  // Calls first:
  //   10% → 50% → 90%
  //   Calls: +40 points.
  //   Pipe:  +40 points.
  //
  // Pipe first:
  //   10% → 30% → 90%
  //   Pipe:  +20 points.
  //   Calls: +60 points.
  //
  // Shapley attribution for calls = (40 + 60) / 2 = 50 points.
  // Shapley attribution for pipe  = (40 + 20) / 2 = 30 points.
  //
  // 10% + 50 points + 30 points = 90%.
  //
  // Both orders use the same trained model.
  // The reference is explicitly chosen, not the group mean.
  // Contributions explain predictions, not causal effects.

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22
  // Content between y = -5.5 and y = 4.3.
  //
  // Laptop: 14.22 x 8
  // Content between y = -3.0 and y = 2.3.
  // ------------------------------------------------------------

  const CX = 0;

  const PILL = P
    ? [0, 3.85, 0]
    : [0, 1.95, 0];

  const BOXP = P
    ? [0, -3.85, 0]
    : [0, -2.62, 0];

  const CALL_COLOR = C.cyan;
  const PIPE_COLOR = C.violet;
  const RISK_COLOR = C.green;
  const REF_COLOR = C.muted;
  const CHANGE_COLOR = C.amber;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function txt(s, size, color, p, mono = false, maxw = null) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    w, h, p, color,
    fill = 0,
    stroke = 2,
    radius = 0.12
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: stroke
    });

    r.setFill(color, fill);
    r.moveTo(p);

    return r;
  }

  function solidRect(w, h, p, color, opacity = 0.85) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1
    });

    r.setFill(color, opacity);
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

  function arrow(a, b, color = C.muted, strokeWidth = 2.4) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const size = 0.13;

    const left = [
      b[0] - size * ux + size * 0.55 * uy,
      b[1] - size * uy - size * 0.55 * ux,
      0
    ];

    const right = [
      b[0] - size * ux - size * 0.55 * uy,
      b[1] - size * uy + size * 0.55 * ux,
      0
    ];

    return new M.VGroup(
      line(a, b, color, strokeWidth),
      line(left, b, color, strokeWidth),
      line(right, b, color, strokeWidth)
    );
  }

  const ins = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const outs = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  function lagIn(objects, runTime = 1.0, lagRatio = 0.12) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20;
    const lh = P ? 0.43 : 0.32;
    const padding = P ? 0.36 : 0.22;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const s = rows[i][0];
      const indent = s.length - s.trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.64;
    const ht = rows.length * lh + padding;

    const bg = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    bg.setFill(C.card, 0.96);
    bg.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.32;
    const top = BOXP[1] + ht / 2 - padding / 2 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];
      const indent = cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(bg, ...texts);

    const maxw = P ? FW - 0.70 : FW - 2.20;
    const maxh = P ? 2.15 : 1.02;

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

  function dropBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Opening picture: a dispatcher asks about Home A.
  // ------------------------------------------------------------

  function house(x, y, name, color = CALL_COLOR) {
    const wall = new M.Rectangle({
      width: 1.22,
      height: 1.04,
      color,
      strokeWidth: 2
    });

    wall.setFill(C.card, 0.95);
    wall.moveTo([x, y, 0]);

    const roofL = line(
      [x - 0.76, y + 0.50, 0],
      [x, y + 1.20, 0],
      color,
      3.4
    );

    const roofR = line(
      [x, y + 1.20, 0],
      [x + 0.76, y + 0.50, 0],
      color,
      3.4
    );

    const door = solidRect(
      0.30,
      0.49,
      [x, y - 0.26, 0],
      color,
      0.25
    );

    const windows = [-0.35, 0.35].map(dx =>
      solidRect(
        0.23,
        0.23,
        [x + dx, y + 0.15, 0],
        color,
        0.62
      )
    );

    const pipe = line(
      [x - 0.62, y - 0.67, 0],
      [x + 0.62, y - 0.67, 0],
      PIPE_COLOR,
      5
    );

    const label = txt(
      name,
      23,
      C.ink,
      [x, y - 1.01, 0]
    );

    const district = txt(
      'North',
      16,
      CALL_COLOR,
      [x, y - 1.33, 0]
    );

    return new M.VGroup(
      wall,
      roofL,
      roofR,
      door,
      ...windows,
      pipe,
      label,
      district
    );
  }

  function dispatcherIcon(x, y) {
    const head = new M.Circle({
      radius: 0.23,
      color: C.ink,
      strokeWidth: 1.5
    });

    head.setFill(C.ink, 0.92);
    head.moveTo([x, y + 0.59, 0]);

    const body = new M.Arc({
      radius: 0.45,
      startAngle: 0,
      angle: Math.PI,
      color: C.ink
    });

    body.setFill(C.ink, 0.85);
    body.moveTo([x, y + 0.05, 0]);

    const desk = rect(
      1.48,
      0.43,
      [x, y - 0.32, 0],
      PIPE_COLOR,
      0.14,
      2
    );

    const screen = rect(
      0.75,
      0.47,
      [x + 0.47, y + 0.23, 0],
      CALL_COLOR,
      0.20,
      1.8
    );

    const label = txt(
      'Dispatcher',
      21,
      C.ink,
      [x, y - 0.87, 0]
    );

    return new M.VGroup(
      head,
      body,
      desk,
      screen,
      label
    );
  }

  const INTRO_X = P ? 1.85 : 2.55;
  const INTRO_Y = P ? 1.30 : 0.23;

  const dispatcher = dispatcherIcon(
    -INTRO_X,
    INTRO_Y
  );

  const openingHouse = house(
    INTRO_X,
    INTRO_Y,
    'Home A'
  );

  const openingQuestion = txt(
    '?',
    42,
    CHANGE_COLOR,
    [0, INTRO_Y + 0.30, 0],
    true
  );

  // 0 — Why does Home A have such a high predicted risk?
  await until(S(0));
  await play(
    new M.FadeIn(dispatcher),
    new M.FadeIn(openingHouse),
    new M.FadeIn(openingQuestion),
    ...say('WHY IS HOME A’S PREDICTED RISK SO HIGH?')
  );

  // ------------------------------------------------------------
  // Request cards.
  //
  // Calls are cyan.
  // Pipe type is violet.
  // Predicted risk is green.
  // Reference data uses a neutral outline.
  //
  // Every displayed risk strip uses the same 0–100% scale.
  // ------------------------------------------------------------

  function requestCard(
    title,
    calls,
    pipe,
    risk,
    p,
    w,
    h,
    color = C.muted,
    compact = false
  ) {
    const x = p[0];
    const y = p[1];

    const bg = rect(
      w,
      h,
      p,
      color,
      0,
      1.8,
      compact ? 0.11 : 0.16
    );

    bg.setFill(C.card, 0.95);

    const titleText = txt(
      title,
      compact ? 17 : 23,
      color === REF_COLOR ? C.ink : color,
      [x, y + h * 0.355, 0],
      false,
      w - 0.22
    );

    const callsText = txt(
      calls === null
        ? 'Calls: ?'
        : `${calls} ${calls === 1 ? 'call' : 'calls'}`,
      compact ? 18 : 23,
      CALL_COLOR,
      [x, y + h * 0.145, 0],
      true,
      w - 0.20
    );

    const pipeText = txt(
      pipe === null
        ? 'Pipe: ?'
        : `${pipe} pipe`,
      compact ? 17 : 22,
      PIPE_COLOR,
      [x, y - h * 0.035, 0],
      false,
      w - 0.20
    );

    const divider = line(
      [x - w * 0.40, y - h * 0.135, 0],
      [x + w * 0.40, y - h * 0.135, 0],
      C.muted,
      1
    );

    const riskText = txt(
      risk === null ? 'Risk: ?' : `Risk: ${risk}%`,
      compact ? 18 : 25,
      risk === null ? C.muted : RISK_COLOR,
      [x, y - h * 0.245, 0],
      true,
      w - 0.18
    );

    const rw = w * 0.72;
    const rh = compact ? 0.075 : 0.13;
    const by = y - h * 0.365;

    const track = solidRect(
      rw,
      rh,
      [x, by, 0],
      C.muted,
      0.14
    );

    const parts = [
      bg,
      titleText,
      callsText,
      pipeText,
      divider,
      riskText,
      track
    ];

    if (risk !== null) {
      const bw = rw * risk / 100;

      const fill = solidRect(
        bw,
        rh,
        [x - rw / 2 + bw / 2, by, 0],
        RISK_COLOR,
        0.90
      );

      parts.push(fill);
    }

    const zero = txt(
      '0',
      15,
      C.muted,
      [x - rw / 2, y - h * 0.445, 0],
      true
    );

    const hundred = txt(
      '100',
      15,
      C.muted,
      [x + rw / 2, y - h * 0.445, 0],
      true
    );

    parts.push(zero, hundred);

    return {
      group: new M.VGroup(...parts),
      callsText,
      pipeText,
      riskText,
      titleText
    };
  }

  function replaceCard(oldCard, newCard) {
    return [
      new M.FadeOut(oldCard.group),
      new M.FadeIn(newCard.group)
    ];
  }

  const MAIN_W = P ? 3.65 : 4.10;
  const MAIN_H = P ? 2.38 : 2.05;
  const MAIN_Y = P ? 1.43 : 0.10;

  const mainPos = [0, MAIN_Y, 0];

  let mainCard = requestCard(
    'Home A — North',
    null,
    null,
    null,
    mainPos,
    MAIN_W,
    MAIN_H,
    CALL_COLOR
  );

  // 1 — Look at the information the model uses.
  await until(S(1));
  await play(
    ...outs([
      dispatcher,
      openingHouse,
      openingQuestion
    ]),
    new M.FadeIn(mainCard.group),
    ...say('WHAT INFORMATION DOES THE MODEL USE?')
  );

  // 2 — Home A has two calls and an older pipe.
  await until(S(2));

  const mainInputs = requestCard(
    'Home A — North',
    HOME_A.calls,
    HOME_A.pipe,
    null,
    mainPos,
    MAIN_W,
    MAIN_H,
    CALL_COLOR
  );

  await play(
    ...replaceCard(mainCard, mainInputs),
    ...say('HOME A: 2 CALLS, OLDER PIPE')
  );

  mainCard = mainInputs;

  // 3 — Home A has a predicted risk of 90%.
  await until(S(3));

  const mainPrediction = requestCard(
    'Home A — North',
    HOME_A.calls,
    HOME_A.pipe,
    HOME_A.risk,
    mainPos,
    MAIN_W,
    MAIN_H,
    CALL_COLOR
  );

  await play(
    ...replaceCard(mainCard, mainPrediction),
    ...fbox([
      ['Predicted risk = 90%', RISK_COLOR],
      'Estimated chance of an urgent visit'
    ], RISK_COLOR),
    ...say('HOME A’S PREDICTED RISK IS 90%', RISK_COLOR)
  );

  mainCard = mainPrediction;

  // 4 — How much comes from the calls?
  await until(S(4));
  await play(
    new M.Indicate(
      mainCard.callsText,
      { color: CALL_COLOR }
    ),
    ...fbox([
      ['Calls: how much do they contribute?', CALL_COLOR]
    ]),
    ...say('HOW MUCH COMES FROM THE CALLS?')
  );

  // 5 — How much comes from the older pipe?
  await until(S(5));
  await play(
    new M.Indicate(
      mainCard.pipeText,
      { color: PIPE_COLOR }
    ),
    ...fbox([
      ['Older pipe: how much does it contribute?', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('HOW MUCH COMES FROM THE PIPE?', PIPE_COLOR)
  );

  // ------------------------------------------------------------
  // Compare Home A with an explicit reference.
  // ------------------------------------------------------------

  const COMP_X = P ? 1.83 : 2.62;
  const COMP_Y = P ? 1.47 : 0.25;
  const COMP_W = P ? 3.23 : 4.00;
  const COMP_H = P ? 2.22 : 1.90;

  const refPos = [-COMP_X, COMP_Y, 0];
  const homePos = [COMP_X, COMP_Y, 0];

  let referenceCard = null;
  let comparisonHome = null;

  const referenceQuestion = rect(
    COMP_W,
    COMP_H,
    refPos,
    REF_COLOR,
    0.04,
    1.6,
    0.16
  );

  const referenceQuestionText = txt(
    'Starting point?',
    23,
    REF_COLOR,
    refPos,
    false,
    COMP_W - 0.30
  );

  const compareArrow = arrow(
    [
      -COMP_X + COMP_W / 2 + 0.05,
      COMP_Y,
      0
    ],
    [
      COMP_X - COMP_W / 2 - 0.05,
      COMP_Y,
      0
    ],
    CHANGE_COLOR,
    2.2
  );

  // 6 — Choose a starting point for comparison.
  await until(S(6));

  comparisonHome = requestCard(
    'Home A — North',
    HOME_A.calls,
    HOME_A.pipe,
    HOME_A.risk,
    homePos,
    COMP_W,
    COMP_H,
    CALL_COLOR
  );

  await play(
    new M.FadeOut(mainCard.group),
    new M.FadeIn(comparisonHome.group),
    new M.FadeIn(referenceQuestion),
    new M.FadeIn(referenceQuestionText),
    new M.FadeIn(compareArrow),
    ...fbox([
      ['Choose a starting point', REF_COLOR],
      'Compare Home A with that starting point'
    ]),
    ...say('WE NEED A STARTING POINT', CHANGE_COLOR)
  );

  // 7 — Imaginary request: zero calls and a newer pipe.
  await until(S(7));

  referenceCard = requestCard(
    'Imaginary request',
    REFERENCE.calls,
    REFERENCE.pipe,
    null,
    refPos,
    COMP_W,
    COMP_H,
    REF_COLOR
  );

  await play(
    new M.FadeOut(referenceQuestion),
    new M.FadeOut(referenceQuestionText),
    new M.FadeIn(referenceCard.group),
    ...say('START WITH 0 CALLS AND A NEWER PIPE')
  );

  // 8 — The reference request has 10% predicted risk.
  await until(S(8));

  const referencePrediction = requestCard(
    'Imaginary request',
    REFERENCE.calls,
    REFERENCE.pipe,
    REFERENCE.risk,
    refPos,
    COMP_W,
    COMP_H,
    REF_COLOR
  );

  await play(
    ...replaceCard(referenceCard, referencePrediction),
    ...fbox([
      ['0 calls + newer pipe', C.ink],
      ['Predicted risk = 10%', RISK_COLOR]
    ], RISK_COLOR),
    ...say('STARTING PREDICTED RISK = 10%', RISK_COLOR)
  );

  referenceCard = referencePrediction;

  // 9 — Name this starting point the reference.
  await until(S(9));

  const namedReference = requestCard(
    'REFERENCE',
    REFERENCE.calls,
    REFERENCE.pipe,
    REFERENCE.risk,
    refPos,
    COMP_W,
    COMP_H,
    REF_COLOR
  );

  await play(
    ...replaceCard(referenceCard, namedReference),
    ...fbox([
      ['Reference = chosen starting point', REF_COLOR]
    ]),
    ...say('STARTING POINT = REFERENCE')
  );

  referenceCard = namedReference;

  // ------------------------------------------------------------
  // A shared risk scale showing the difference from 10% to 90%.
  // ------------------------------------------------------------

  const DIFF_W = P ? 5.95 : 7.00;
  const DIFF_Y = P ? -0.46 : -1.35;

  const diffX = risk =>
    -DIFF_W / 2 + DIFF_W * risk / 100;

  function differencePicture() {
    const base = line(
      [diffX(0), DIFF_Y, 0],
      [diffX(100), DIFF_Y, 0],
      C.muted,
      3
    );

    const start = new M.Dot({
      point: [diffX(REFERENCE.risk), DIFF_Y, 0],
      radius: 0.10,
      color: C.ink
    });

    const end = new M.Dot({
      point: [diffX(HOME_A.risk), DIFF_Y, 0],
      radius: 0.10,
      color: RISK_COLOR
    });

    const increase = line(
      [diffX(REFERENCE.risk), DIFF_Y, 0],
      [diffX(HOME_A.risk), DIFF_Y, 0],
      CHANGE_COLOR,
      6
    );

    const labels = [
      txt(
        '10%',
        20,
        C.ink,
        [diffX(10), DIFF_Y - 0.28, 0],
        true
      ),
      txt(
        '90%',
        20,
        RISK_COLOR,
        [diffX(90), DIFF_Y - 0.28, 0],
        true
      ),
      txt(
        '+80 percentage points',
        P ? 23 : 21,
        CHANGE_COLOR,
        [0, DIFF_Y + 0.35, 0],
        false,
        DIFF_W
      )
    ];

    return new M.VGroup(
      base,
      increase,
      start,
      end,
      ...labels
    );
  }

  const difference = differencePicture();

  // 10 — Home A's risk is 80 percentage points higher.
  await until(S(10));
  await play(
    new M.FadeIn(difference),
    ...fbox([
      ['90% − 10% = 80 percentage points', CHANGE_COLOR]
    ], CHANGE_COLOR),
    ...say('HOME A IS 80 PERCENTAGE POINTS HIGHER', CHANGE_COLOR)
  );

  // 11 — Share the 80 points between the two features.
  await until(S(11));
  await play(
    new M.Indicate(
      comparisonHome.callsText,
      { color: CALL_COLOR }
    ),
    new M.Indicate(
      comparisonHome.pipeText,
      { color: PIPE_COLOR }
    ),
    ...fbox([
      ['80 points to explain', CHANGE_COLOR],
      ['Calls: ? points', CALL_COLOR],
      ['Pipe:  ? points', PIPE_COLOR]
    ]),
    ...say('HOW SHOULD WE SHARE THE 80 POINTS?', CHANGE_COLOR)
  );

  // ------------------------------------------------------------
  // Analogy: two people carrying one heavy box.
  //
  // The picture illustrates sharing credit for a joint result.
  // It does not assume that the two contributions are equal.
  // ------------------------------------------------------------

  const CARRY_Y = P ? 1.12 : 0.15;
  const CARRY_X = P ? 2.02 : 2.28;

  function worker(x, y, direction, color) {
    const head = new M.Circle({
      radius: 0.23,
      color,
      strokeWidth: 2
    });

    head.setFill(color, 0.82);
    head.moveTo([x, y + 0.78, 0]);

    const torso = line(
      [x, y + 0.52, 0],
      [x, y - 0.28, 0],
      color,
      5
    );

    const legL = line(
      [x, y - 0.28, 0],
      [x - 0.30, y - 0.87, 0],
      color,
      4
    );

    const legR = line(
      [x, y - 0.28, 0],
      [x + 0.30, y - 0.87, 0],
      color,
      4
    );

    const elbow = [
      x + direction * 0.42,
      y + 0.08,
      0
    ];

    const hand = [
      x + direction * (CARRY_X - 1.03),
      y + 0.10,
      0
    ];

    const upperArm = line(
      [x, y + 0.32, 0],
      elbow,
      color,
      4
    );

    const lowerArm = line(
      elbow,
      hand,
      color,
      4
    );

    return new M.VGroup(
      head,
      torso,
      legL,
      legR,
      upperArm,
      lowerArm
    );
  }

  const workerOne = worker(
    -CARRY_X,
    CARRY_Y,
    1,
    C.ink
  );

  const workerTwo = worker(
    CARRY_X,
    CARRY_Y,
    -1,
    C.ink
  );

  const heavyBox = rect(
    2.08,
    1.10,
    [0, CARRY_Y + 0.45, 0],
    CHANGE_COLOR,
    0.16,
    2.5,
    0.07
  );

  const boxTape = solidRect(
    0.23,
    1.04,
    [0, CARRY_Y + 0.45, 0],
    CHANGE_COLOR,
    0.32
  );

  const heavyLabel = txt(
    'HEAVY BOX',
    19,
    CHANGE_COLOR,
    [0, CARRY_Y + 0.45, 0],
    true,
    1.85
  );

  const workerLabelOne = txt(
    'Person 1',
    19,
    C.ink,
    [-CARRY_X, CARRY_Y - 1.14, 0]
  );

  const workerLabelTwo = txt(
    'Person 2',
    19,
    C.ink,
    [CARRY_X, CARRY_Y - 1.14, 0]
  );

  const carryingPicture = new M.VGroup(
    workerOne,
    workerTwo,
    heavyBox,
    boxTape,
    heavyLabel,
    workerLabelOne,
    workerLabelTwo
  );

  // 12 — Two people carry a heavy box together.
  await until(S(12));
  await play(
    ...outs([
      referenceCard.group,
      comparisonHome.group,
      compareArrow,
      difference
    ]),
    ...dropBox(),
    new M.FadeIn(carryingPicture),
    ...say('TWO PEOPLE WORK TOGETHER', CHANGE_COLOR)
  );

  const creditOne = pill(
    'CREDIT: ?',
    CALL_COLOR,
    18
  );

  creditOne.moveTo([
    -CARRY_X,
    P ? -0.57 : -1.58,
    0
  ]);

  const creditTwo = pill(
    'CREDIT: ?',
    PIPE_COLOR,
    18
  );

  creditTwo.moveTo([
    CARRY_X,
    P ? -0.57 : -1.58,
    0
  ]);

  // 13 — Give each person a fair share of the credit.
  await until(S(13));
  await play(
    new M.FadeIn(creditOne),
    new M.FadeIn(creditTwo),
    ...fbox([
      ['One joint result', CHANGE_COLOR],
      'How much credit belongs to each person?'
    ]),
    ...say('SHARE THE CREDIT FAIRLY', CHANGE_COLOR)
  );

  // ------------------------------------------------------------
  // Return to the model.
  //
  // Credit is measured through changes in predicted risk.
  // ------------------------------------------------------------

  const creditCalls = pill(
    'CALLS: ? POINTS',
    CALL_COLOR,
    18
  );

  creditCalls.moveTo([
    P ? -1.72 : -2.40,
    P ? -0.38 : -1.18,
    0
  ]);

  const creditPipe = pill(
    'PIPE: ? POINTS',
    PIPE_COLOR,
    18
  );

  creditPipe.moveTo([
    P ? 1.72 : 2.40,
    P ? -0.38 : -1.18,
    0
  ]);

  // 14 — Measure how much each feature adds to the prediction.
  await until(S(14));
  await play(
    ...outs([
      carryingPicture,
      creditOne,
      creditTwo
    ]),
    new M.FadeIn(referenceCard.group),
    new M.FadeIn(comparisonHome.group),
    new M.FadeIn(compareArrow),
    new M.FadeIn(creditCalls),
    new M.FadeIn(creditPipe),
    ...fbox([
      ['Measure the change in predicted risk', RISK_COLOR],
      'when we change each feature'
    ]),
    ...say('GIVE CREDIT TO EACH FEATURE')
  );

  // ------------------------------------------------------------
  // Two possible orders.
  //
  // No feature contributions are revealed yet.
  // ------------------------------------------------------------

  function orderChoice(number, first, second, p) {
    const w = P ? 6.15 : 6.40;
    const h = P ? 0.62 : 0.48;

    const bg = rect(
      w,
      h,
      p,
      C.muted,
      0,
      1.2,
      0.10
    );

    bg.setFill(C.card, 0.86);

    const numberText = txt(
      `ORDER ${number}`,
      P ? 15 : 16,
      C.muted,
      [p[0] - w * 0.33, p[1], 0],
      true,
      w * 0.26
    );

    const firstColor =
      first === 'Calls' ? CALL_COLOR : PIPE_COLOR;

    const secondColor =
      second === 'Calls' ? CALL_COLOR : PIPE_COLOR;

    const firstText = txt(
      first,
      19,
      firstColor,
      [p[0] - w * 0.09, p[1], 0],
      false,
      w * 0.21
    );

    const arrowText = txt(
      '→',
      21,
      C.muted,
      [p[0] + w * 0.09, p[1], 0]
    );

    const secondText = txt(
      second,
      19,
      secondColor,
      [p[0] + w * 0.30, p[1], 0],
      false,
      w * 0.27
    );

    return new M.VGroup(
      bg,
      numberText,
      firstText,
      arrowText,
      secondText
    );
  }

  const orderOneChoice = orderChoice(
    1,
    'Calls',
    'Pipe',
    [0, P ? -0.28 : -0.99, 0]
  );

  const orderTwoChoice = orderChoice(
    2,
    'Pipe',
    'Calls',
    [0, P ? -1.06 : -1.56, 0]
  );

  // 15 — Contributions can depend on which feature changes first.
  await until(S(15));
  await play(
    new M.FadeOut(creditCalls),
    new M.FadeOut(creditPipe),
    new M.FadeIn(orderOneChoice),
    ...fbox([
      ['Changing calls first', CALL_COLOR],
      'may give different contributions'
    ]),
    ...say('THE ORDER CAN CHANGE THE CREDIT', CHANGE_COLOR)
  );

  // 16 — Try every order, then average the contributions.
  await until(S(16));
  await play(
    new M.FadeIn(orderTwoChoice),
    ...fbox([
      ['Try every possible order', CHANGE_COLOR],
      ['Find the mean contribution for each feature', RISK_COLOR]
    ], RISK_COLOR),
    ...say('TRY EVERY ORDER, THEN TAKE THE MEAN', RISK_COLOR)
  );

  // 17 — Define contribution.
  await until(S(17));
  await play(
    ...fbox([
      ['Contribution = amount a feature adds', CHANGE_COLOR],
      'or removes from a prediction'
    ], CHANGE_COLOR),
    ...say('CONTRIBUTION = CHANGE IN THE PREDICTION', CHANGE_COLOR)
  );

  // 18 — Name Shapley attributions.
  await until(S(18));
  await play(
    ...fbox([
      ['Shapley attribution', PIPE_COLOR],
      'Mean contribution across all possible orders'
    ], PIPE_COLOR),
    ...say('SHAPLEY ATTRIBUTIONS', PIPE_COLOR)
  );

  // 19 — With two features there are two possible orders.
  await until(S(19));
  await play(
    new M.Indicate(
      orderOneChoice,
      { color: CALL_COLOR }
    ),
    new M.Indicate(
      orderTwoChoice,
      { color: PIPE_COLOR }
    ),
    ...fbox([
      ['2 features → 2 possible orders', CHANGE_COLOR],
      'Both orders receive equal weight'
    ]),
    ...say('TWO FEATURES, TWO POSSIBLE ORDERS')
  );

  // ------------------------------------------------------------
  // Two paths from the reference to Home A.
  //
  // Each path contains three states.
  //
  // Phone: two vertically stacked rows.
  // Laptop: two wider vertically stacked rows.
  //
  // The same risk scale is used in every state card.
  // Contributions appear between states, after their predictions.
  // ------------------------------------------------------------

  // Laptop: each order is a row (stages left to right).
  // Phone: each order is a column (stages top to bottom), so the cards stay big.
  const PATH_X = P
    ? [-1.95, 1.95]
    : [-4.10, 0, 4.10];

  const PATH_Y = P
    ? [2.30, 0.22, -1.86]
    : [0.60, -1.30];

  const PATH_W = P ? 3.55 : 2.65;
  const PATH_H = P ? 1.30 : 1.30;

  const pathPos = (order, stage) => P
    ? [PATH_X[order], PATH_Y[stage], 0]
    : [PATH_X[stage], PATH_Y[order], 0];

  const pathTitles = [
    txt(
      P ? 'ORDER 1: CALLS FIRST' : 'ORDER 1: CALLS FIRST, THEN PIPE',
      P ? 19 : 21,
      CALL_COLOR,
      P ? [PATH_X[0], PATH_Y[0] + PATH_H / 2 + 0.30, 0]
        : [0, PATH_Y[0] + PATH_H / 2 + 0.28, 0],
      true,
      P ? PATH_W : FW - 0.80
    ),
    txt(
      P ? 'ORDER 2: PIPE FIRST' : 'ORDER 2: PIPE FIRST, THEN CALLS',
      P ? 19 : 21,
      PIPE_COLOR,
      P ? [PATH_X[1], PATH_Y[0] + PATH_H / 2 + 0.30, 0]
        : [0, PATH_Y[1] + PATH_H / 2 + 0.28, 0],
      true,
      P ? PATH_W : FW - 0.80
    )
  ];

  const pathStates = [
    [null, null, null],
    [null, null, null]
  ];

  const pathArrows = [
    [null, null],
    [null, null]
  ];

  const pathCredits = [
    [null, null],
    [null, null]
  ];

  function makePathState(
    order,
    stage,
    data,
    riskVisible = true
  ) {
    const title = stage === 0
      ? 'Reference'
      : stage === 2
        ? 'Home A'
        : 'Intermediate';

    const color = stage === 0
      ? REF_COLOR
      : stage === 2
        ? CALL_COLOR
        : C.muted;

    return requestCard(
      title,
      data.calls,
      data.pipe,
      riskVisible ? data.risk : null,
      pathPos(order, stage),
      PATH_W,
      PATH_H,
      color,
      true
    );
  }

  function addPathState(
    order,
    stage,
    data,
    riskVisible = true
  ) {
    const next = makePathState(
      order,
      stage,
      data,
      riskVisible
    );

    pathStates[order][stage] = next;

    return new M.FadeIn(next.group);
  }

  function revealPathRisk(order, stage, data) {
    const next = makePathState(
      order,
      stage,
      data,
      true
    );

    const previous = pathStates[order][stage];

    pathStates[order][stage] = next;

    return replaceCard(previous, next);
  }

  function pathEdge(order, stage, feature) {
    const color = feature === 'Calls'
      ? CALL_COLOR
      : PIPE_COLOR;

    let shaft, label;

    if (P) {
      // vertical arrow between two stacked cards; feature name on its left
      const x = PATH_X[order];
      const top = PATH_Y[stage] - PATH_H / 2 - 0.05;
      const bottom = PATH_Y[stage + 1] + PATH_H / 2 + 0.05;

      shaft = arrow(
        [x, top, 0],
        [x, bottom, 0],
        color,
        2.6
      );

      label = txt(
        feature,
        18,
        color,
        [x - 0.75, (top + bottom) / 2, 0],
        false,
        1.20
      );
    } else {
      const y = PATH_Y[order];
      const left = PATH_X[stage] + PATH_W / 2 + 0.05;
      const right = PATH_X[stage + 1] - PATH_W / 2 - 0.05;
      const x = (left + right) / 2;

      shaft = arrow(
        [left, y, 0],
        [right, y, 0],
        color,
        2.6
      );

      label = txt(
        feature,
        18,
        color,
        [x, y + 0.29, 0],
        false,
        right - left + 0.06
      );
    }

    const g = new M.VGroup(
      shaft,
      label
    );

    pathArrows[order][stage] = g;

    return g;
  }

  function pathContribution(order, stage, value, feature) {
    const color = feature === 'Calls'
      ? CALL_COLOR
      : PIPE_COLOR;

    const x = P
      ? PATH_X[order] + 0.80
      : (PATH_X[stage] + PATH_X[stage + 1]) / 2;

    const y = P
      ? (PATH_Y[stage] + PATH_Y[stage + 1]) / 2
      : PATH_Y[order] - 0.35;

    const w = P ? 0.95 : 1.12;

    const bg = rect(
      w,
      P ? 0.38 : 0.35,
      [x, y, 0],
      color,
      0.12,
      1.5,
      0.08
    );

    const label = txt(
      `+${value}`,
      P ? 19 : 22,
      color,
      [x, y, 0],
      true,
      w - 0.10
    );

    const g = new M.VGroup(bg, label);

    pathCredits[order][stage] = g;

    return g;
  }

  function clearPaths() {
    const objects = [
      ...pathTitles,
      ...pathStates.flat()
        .filter(Boolean)
        .map(card => card.group),
      ...pathArrows.flat().filter(Boolean),
      ...pathCredits.flat().filter(Boolean)
    ];

    return outs(objects);
  }

  // ------------------------------------------------------------
  // Order 1 — Calls first.
  // ------------------------------------------------------------

  // 20 — Draw the first order.
  await until(S(20));
  await play(
    ...outs([
      referenceCard.group,
      comparisonHome.group,
      compareArrow,
      orderOneChoice,
      orderTwoChoice
    ]),
    new M.FadeIn(pathTitles[0]),
    ...fbox([
      ['First change calls', CALL_COLOR],
      ['Then change the pipe', PIPE_COLOR]
    ]),
    ...say('ORDER 1: CHANGE CALLS FIRST')
  );

  // 21 — Begin at the reference: 0 calls, newer pipe, 10%.
  await until(S(21));
  await play(
    addPathState(
      0,
      0,
      CALLS_FIRST[0]
    ),
    ...fbox([
      ['Reference: 0 calls, newer pipe', REF_COLOR],
      ['Risk = 10%', RISK_COLOR]
    ]),
    ...say('START AT THE 10% REFERENCE')
  );

  // 22 — Change calls from zero to two.
  await until(S(22));

  const firstCallsArrow = pathEdge(
    0,
    0,
    'Calls'
  );

  await play(
    new M.FadeIn(firstCallsArrow),
    addPathState(
      0,
      1,
      CALLS_FIRST[1],
      false
    ),
    ...fbox([
      ['Calls: 0 → 2', CALL_COLOR],
      'Ask the same trained model'
    ]),
    ...say('CHANGE CALLS FROM 0 TO 2')
  );

  // 23 — The pipe remains newer.
  await until(S(23));
  await play(
    new M.Indicate(
      pathStates[0][1].pipeText,
      { color: PIPE_COLOR }
    ),
    ...say('THE PIPE STAYS NEWER', PIPE_COLOR)
  );

  // 24 — The prediction rises from 10% to 50%.
  await until(S(24));
  await play(
    ...revealPathRisk(
      0,
      1,
      CALLS_FIRST[1]
    ),
    ...fbox([
      ['Predicted risk: 10% → 50%', RISK_COLOR]
    ], RISK_COLOR),
    ...say('THE PREDICTED RISK RISES TO 50%', RISK_COLOR)
  );

  // 25 — Calls contribute 40 percentage points.
  await until(S(25));

  const callsCredit40 = pathContribution(
    0,
    0,
    CALLS_CONTRIBUTIONS[0],
    'Calls'
  );

  await play(
    new M.FadeIn(callsCredit40),
    ...fbox([
      ['Calls contribution: 50% − 10%', CALL_COLOR],
      ['= +40 percentage points', CHANGE_COLOR]
    ]),
    ...say('CALLS ADD 40 PERCENTAGE POINTS')
  );

  // 26 — Now change the pipe from newer to older.
  await until(S(26));

  const firstPipeArrow = pathEdge(
    0,
    1,
    'Pipe'
  );

  await play(
    new M.FadeIn(firstPipeArrow),
    addPathState(
      0,
      2,
      CALLS_FIRST[2],
      false
    ),
    ...fbox([
      ['Pipe: newer → older', PIPE_COLOR],
      ['Keep 2 calls', CALL_COLOR]
    ], PIPE_COLOR),
    ...say('NOW CHANGE THE PIPE TO OLDER', PIPE_COLOR)
  );

  // 27 — Predicted risk rises from 50% to 90%.
  await until(S(27));
  await play(
    ...revealPathRisk(
      0,
      2,
      CALLS_FIRST[2]
    ),
    ...fbox([
      ['Predicted risk: 50% → 90%', RISK_COLOR]
    ], RISK_COLOR),
    ...say('THE PREDICTED RISK RISES TO 90%', RISK_COLOR)
  );

  // 28 — The older pipe contributes 40 percentage points.
  await until(S(28));

  const pipeCredit40 = pathContribution(
    0,
    1,
    PIPE_CONTRIBUTIONS[0],
    'Pipe'
  );

  await play(
    new M.FadeIn(pipeCredit40),
    ...fbox([
      ['Pipe contribution: 90% − 50%', PIPE_COLOR],
      ['= +40 percentage points', CHANGE_COLOR]
    ], PIPE_COLOR),
    ...say('THE OLDER PIPE ADDS 40 POINTS', PIPE_COLOR)
  );

  // ------------------------------------------------------------
  // Order 2 — Pipe first.
  //
  // Preserve the first path for comparison.
  // Start again at the exact same reference.
  // ------------------------------------------------------------

  // 29 — Return to the reference and try the opposite order.
  await until(S(29));
  await play(
    new M.FadeIn(pathTitles[1]),
    addPathState(
      1,
      0,
      PIPE_FIRST[0]
    ),
    ...fbox([
      ['Return to the same reference', REF_COLOR],
      ['This time change the pipe first', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('ORDER 2: CHANGE THE PIPE FIRST', PIPE_COLOR)
  );

  // 30 — Change the pipe to older, retaining zero calls.
  await until(S(30));

  const secondPipeArrow = pathEdge(
    1,
    0,
    'Pipe'
  );

  await play(
    new M.FadeIn(secondPipeArrow),
    addPathState(
      1,
      1,
      PIPE_FIRST[1],
      false
    ),
    ...fbox([
      ['Pipe: newer → older', PIPE_COLOR],
      ['Calls remain at 0', CALL_COLOR]
    ], PIPE_COLOR),
    ...say('CHANGE ONLY THE PIPE TYPE', PIPE_COLOR)
  );

  // 31 — Predicted risk rises from 10% to 30%.
  await until(S(31));
  await play(
    ...revealPathRisk(
      1,
      1,
      PIPE_FIRST[1]
    ),
    ...fbox([
      ['Predicted risk: 10% → 30%', RISK_COLOR]
    ], RISK_COLOR),
    ...say('THE PREDICTED RISK RISES TO 30%', RISK_COLOR)
  );

  // 32 — This time the older pipe contributes 20 points.
  await until(S(32));

  const pipeCredit20 = pathContribution(
    1,
    0,
    PIPE_CONTRIBUTIONS[1],
    'Pipe'
  );

  await play(
    new M.FadeIn(pipeCredit20),
    ...fbox([
      ['Pipe contribution: 30% − 10%', PIPE_COLOR],
      ['= +20 percentage points', CHANGE_COLOR]
    ], PIPE_COLOR),
    ...say('THIS TIME THE PIPE ADDS 20 POINTS', PIPE_COLOR)
  );

  // 33 — Change the calls from zero to two.
  await until(S(33));

  const secondCallsArrow = pathEdge(
    1,
    1,
    'Calls'
  );

  await play(
    new M.FadeIn(secondCallsArrow),
    addPathState(
      1,
      2,
      PIPE_FIRST[2],
      false
    ),
    ...fbox([
      ['Calls: 0 → 2', CALL_COLOR],
      ['Keep the older pipe', PIPE_COLOR]
    ]),
    ...say('NOW CHANGE CALLS FROM 0 TO 2')
  );

  // 34 — Predicted risk rises from 30% to 90%.
  await until(S(34));
  await play(
    ...revealPathRisk(
      1,
      2,
      PIPE_FIRST[2]
    ),
    ...fbox([
      ['Predicted risk: 30% → 90%', RISK_COLOR]
    ], RISK_COLOR),
    ...say('THE PREDICTED RISK RISES TO 90%', RISK_COLOR)
  );

  // 35 — This time calls contribute 60 percentage points.
  await until(S(35));

  const callsCredit60 = pathContribution(
    1,
    1,
    CALLS_CONTRIBUTIONS[1],
    'Calls'
  );

  await play(
    new M.FadeIn(callsCredit60),
    ...fbox([
      ['Calls contribution: 90% − 30%', CALL_COLOR],
      ['= +60 percentage points', CHANGE_COLOR]
    ]),
    ...say('THIS TIME CALLS ADD 60 POINTS')
  );

  // ------------------------------------------------------------
  // Compare the two paths.
  //
  // Both begin at the same reference.
  // Both end at the same prediction for Home A.
  // The contributions differ because the order differs.
  // ------------------------------------------------------------

  function endpointOutline(stage, color) {
    // one outline around the same stage of both orders
    const a = pathPos(0, stage);
    const b = pathPos(1, stage);

    const left = Math.min(a[0], b[0]) - PATH_W / 2 - 0.07;
    const right = Math.max(a[0], b[0]) + PATH_W / 2 + 0.07;
    const top = Math.max(a[1], b[1]) + PATH_H / 2 + 0.07;
    const bottom = Math.min(a[1], b[1]) - PATH_H / 2 - 0.07;

    return rect(
      right - left,
      top - bottom,
      [(left + right) / 2, (top + bottom) / 2, 0],
      color,
      0,
      2.2,
      0.13
    );
  }

  const referenceOutline = endpointOutline(
    0,
    C.muted
  );

  const finalOutline = endpointOutline(
    2,
    RISK_COLOR
  );

  // 36 — Both paths start at 10% and end at 90%.
  await until(S(36));
  await play(
    new M.Create(referenceOutline),
    new M.Create(finalOutline),
    ...fbox([
      ['Both start at 10%', REF_COLOR],
      ['Both finish at 90%', RISK_COLOR],
      ['Both explain the same 80-point increase', CHANGE_COLOR]
    ]),
    ...say('SAME START, SAME FINISH', RISK_COLOR)
  );

  // 37 — But feature contributions depend on the order.
  await until(S(37));
  await play(
    new M.FadeOut(referenceOutline),
    new M.FadeOut(finalOutline),
    new M.LaggedStart([
      new M.Indicate(
        callsCredit40,
        { color: CALL_COLOR }
      ),
      new M.Indicate(
        callsCredit60,
        { color: CALL_COLOR }
      ),
      new M.Indicate(
        pipeCredit40,
        { color: PIPE_COLOR }
      ),
      new M.Indicate(
        pipeCredit20,
        { color: PIPE_COLOR }
      )
    ], { lagRatio: 0.12, runTime: 1.55 }),
    ...fbox([
      ['Calls: +40 or +60 points', CALL_COLOR],
      ['Pipe:  +40 or +20 points', PIPE_COLOR]
    ], CHANGE_COLOR),
    ...say('DIFFERENT ORDERS, DIFFERENT CREDIT', CHANGE_COLOR)
  );

  // ------------------------------------------------------------
  // Place the contributions side by side.
  //
  // Rows: calls, pipe type.
  // Columns: order 1, order 2, mean.
  //
  // Each contribution is shown on the same 0–60 point scale.
  // The means are introduced only when calculated.
  // ------------------------------------------------------------

  const CREDIT_X = P
    ? [-1.61, 0.72, 3.03]
    : [-2.05, 0.85, 3.75];

  const CREDIT_ROW_Y = P
    ? [1.42, -0.65]
    : [0.47, -1.02];

  const CREDIT_HEADER_Y = P ? 2.68 : 1.30;

  const CREDIT_W = P ? 1.89 : 2.45;
  const CREDIT_H = P ? 1.38 : 1.00;

  const ROW_LABEL_X = P ? -3.18 : -4.48;

  function contributionFrame() {
    const parts = [];

    const heads = [
      'Order 1',
      'Order 2',
      'Mean'
    ];

    heads.forEach((h, i) => {
      parts.push(
        txt(
          h,
          P ? 19 : 21,
          i === 2 ? RISK_COLOR : C.ink,
          [CREDIT_X[i], CREDIT_HEADER_Y, 0],
          false,
          CREDIT_W
        )
      );
    });

    for (let r = 0; r < 2; r++) {
      const color = r === 0
        ? CALL_COLOR
        : PIPE_COLOR;

      const label = r === 0
        ? 'Calls'
        : 'Pipe';

      parts.push(
        txt(
          label,
          P ? 19 : 23,
          color,
          [ROW_LABEL_X, CREDIT_ROW_Y[r], 0],
          false,
          P ? 1.00 : 1.70
        )
      );

      for (let j = 0; j < 3; j++) {
        const bg = rect(
          CREDIT_W,
          CREDIT_H,
          [CREDIT_X[j], CREDIT_ROW_Y[r], 0],
          j === 2 ? RISK_COLOR : color,
          0,
          1.3,
          0.12
        );

        bg.setFill(
          C.card,
          j === 2 ? 0.90 : 0.68
        );

        parts.push(bg);
      }
    }

    return new M.VGroup(...parts);
  }

  const creditFrame = contributionFrame();

  function contributionBar(row, column, value) {
    const color = row === 0
      ? CALL_COLOR
      : PIPE_COLOR;

    const x = CREDIT_X[column];
    const y = CREDIT_ROW_Y[row];

    const w = CREDIT_W - 0.30;
    const h = P ? 0.19 : 0.15;

    const by = y - CREDIT_H * 0.20;

    const track = solidRect(
      w,
      h,
      [x, by, 0],
      C.muted,
      0.14
    );

    const fillW = w * value / 60;

    const fill = solidRect(
      fillW,
      h,
      [x - w / 2 + fillW / 2, by, 0],
      color,
      0.88
    );

    const valueText = txt(
      `+${value}`,
      P ? 25 : 27,
      color,
      [x, y + CREDIT_H * 0.16, 0],
      true,
      CREDIT_W - 0.20
    );

    const zero = txt(
      '0',
      15,
      C.muted,
      [x - w / 2, by - 0.20, 0],
      true
    );

    const sixty = txt(
      '60',
      15,
      C.muted,
      [x + w / 2, by - 0.18, 0],
      true
    );

    return new M.VGroup(
      track,
      fill,
      valueText,
      zero,
      sixty
    );
  }

  const callBars = [
    contributionBar(
      0,
      0,
      CALLS_CONTRIBUTIONS[0]
    ),
    contributionBar(
      0,
      1,
      CALLS_CONTRIBUTIONS[1]
    ),
    contributionBar(
      0,
      2,
      CALLS_SHAPLEY
    )
  ];

  const pipeBars = [
    contributionBar(
      1,
      0,
      PIPE_CONTRIBUTIONS[0]
    ),
    contributionBar(
      1,
      1,
      PIPE_CONTRIBUTIONS[1]
    ),
    contributionBar(
      1,
      2,
      PIPE_SHAPLEY
    )
  ];

  const creditUnits = txt(
    'Contributions in percentage points',
    P ? 18 : 17,
    C.muted,
    [0, P ? -1.78 : -1.76, 0],
    false,
    FW - 0.90
  );

  // 38 — Put the two orders' contributions next to each other.
  await until(S(38));
  await play(
    ...clearPaths(),
    new M.FadeIn(creditFrame),
    new M.FadeIn(creditUnits),
    ...fbox([
      ['Compare each feature across both orders', C.ink]
    ]),
    ...say('PUT THE CONTRIBUTIONS SIDE BY SIDE')
  );

  // 39 — Calls contributed 40 points and 60 points.
  await until(S(39));
  await play(
    new M.FadeIn(callBars[0]),
    new M.FadeIn(callBars[1]),
    ...fbox([
      ['Calls: +40 and +60 points', CALL_COLOR]
    ]),
    ...say('CALLS: 40 POINTS AND 60 POINTS')
  );

  // 40 — Add the calls contributions.
  await until(S(40));
  await play(
    new M.Indicate(
      callBars[0],
      { color: CALL_COLOR }
    ),
    new M.Indicate(
      callBars[1],
      { color: CALL_COLOR }
    ),
    ...fbox([
      ['40 + 60 = 100', CALL_COLOR]
    ]),
    ...say('ADD THE TWO CALLS CONTRIBUTIONS')
  );

  // 41 — Mean calls contribution = 50 percentage points.
  await until(S(41));
  await play(
    new M.FadeIn(callBars[2]),
    ...fbox([
      '40 + 60 = 100',
      ['100 ÷ 2 = 50 points', CALL_COLOR]
    ], CALL_COLOR),
    ...say('CALLS SHAPLEY ATTRIBUTION = 50 POINTS')
  );

  // 42 — Pipe contributed 40 points and 20 points.
  await until(S(42));
  await play(
    new M.FadeIn(pipeBars[0]),
    new M.FadeIn(pipeBars[1]),
    ...fbox([
      ['Older pipe: +40 and +20 points', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('PIPE: 40 POINTS AND 20 POINTS', PIPE_COLOR)
  );

  // 43 — Add the pipe contributions.
  await until(S(43));
  await play(
    new M.Indicate(
      pipeBars[0],
      { color: PIPE_COLOR }
    ),
    new M.Indicate(
      pipeBars[1],
      { color: PIPE_COLOR }
    ),
    ...fbox([
      ['40 + 20 = 60', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('ADD THE TWO PIPE CONTRIBUTIONS', PIPE_COLOR)
  );

  // 44 — Mean pipe contribution = 30 percentage points.
  await until(S(44));
  await play(
    new M.FadeIn(pipeBars[2]),
    ...fbox([
      '40 + 20 = 60',
      ['60 ÷ 2 = 30 points', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('PIPE SHAPLEY ATTRIBUTION = 30 POINTS', PIPE_COLOR)
  );

  // ------------------------------------------------------------
  // Reconstruct Home A's prediction with a stacked risk bar.
  //
  // Reference: 10%.
  // Calls: +50 percentage points.
  // Older pipe: +30 percentage points.
  // Final predicted risk: 90%.
  //
  // All segments use one common 0–100% scale.
  // ------------------------------------------------------------

  const FINAL_BAR_W = P ? 6.40 : 9.40;
  const FINAL_BAR_H = P ? 0.78 : 0.64;

  const FINAL_BAR_Y = P ? 1.02 : 0.04;

  const finalX = value =>
    -FINAL_BAR_W / 2 + FINAL_BAR_W * value / 100;

  const finalTitle = txt(
    'BUILD HOME A’S PREDICTED RISK',
    P ? 22 : 24,
    C.ink,
    [0, P ? 3.05 : 1.30, 0],
    false,
    FW - 0.80
  );

  const finalTrack = solidRect(
    FINAL_BAR_W,
    FINAL_BAR_H,
    [0, FINAL_BAR_Y, 0],
    C.muted,
    0.12
  );

  const finalScale = new M.VGroup(
    line(
      [finalX(0), FINAL_BAR_Y - FINAL_BAR_H / 2 - 0.14, 0],
      [finalX(0), FINAL_BAR_Y - FINAL_BAR_H / 2 + 0.02, 0],
      C.muted,
      1.6
    ),
    line(
      [finalX(100), FINAL_BAR_Y - FINAL_BAR_H / 2 - 0.14, 0],
      [finalX(100), FINAL_BAR_Y - FINAL_BAR_H / 2 + 0.02, 0],
      C.muted,
      1.6
    ),
    txt(
      '0%',
      16,
      C.muted,
      [
        finalX(0),
        FINAL_BAR_Y - FINAL_BAR_H / 2 - 0.31,
        0
      ],
      true
    ),
    txt(
      '100%',
      16,
      C.muted,
      [
        finalX(100),
        FINAL_BAR_Y - FINAL_BAR_H / 2 - 0.31,
        0
      ],
      true
    )
  );

  function stackedSegment(
    start,
    amount,
    color,
    label,
    featureName,
    reference = false
  ) {
    const left = finalX(start);
    const right = finalX(start + amount);

    const x = (left + right) / 2;
    const w = right - left;

    const fill = solidRect(
      w,
      FINAL_BAR_H,
      [x, FINAL_BAR_Y, 0],
      color,
      reference ? 0.62 : 0.87
    );

    const value = txt(
      label,
      reference ? 19 : 25,
      reference ? C.ink : color,
      [
        x,
        FINAL_BAR_Y + FINAL_BAR_H / 2 + 0.32,
        0
      ],
      true,
      reference
        ? (P ? 0.88 : 1.20)
        : w - 0.12
    );

    const featureText = txt(
      featureName,
      P ? 16 : 18,
      reference ? C.ink : color,
      [
        x,
        FINAL_BAR_Y - FINAL_BAR_H / 2 - 0.78,
        0
      ],
      false,
      reference
        ? (P ? 1.42 : 1.70)
        : w + 0.10
    );

    const boundary = line(
      [
        right,
        FINAL_BAR_Y - FINAL_BAR_H / 2,
        0
      ],
      [
        right,
        FINAL_BAR_Y + FINAL_BAR_H / 2,
        0
      ],
      C.ink,
      1.5
    );

    return new M.VGroup(
      fill,
      value,
      featureText,
      boundary
    );
  }

  const referenceSegment = stackedSegment(
    0,
    REFERENCE.risk,
    REF_COLOR,
    '10%',
    'Reference',
    true
  );

  const callsSegment = stackedSegment(
    REFERENCE.risk,
    CALLS_SHAPLEY,
    CALL_COLOR,
    '+50 points',
    'Calls'
  );

  const pipeSegment = stackedSegment(
    REFERENCE.risk + CALLS_SHAPLEY,
    PIPE_SHAPLEY,
    PIPE_COLOR,
    '+30 points',
    'Older pipe'
  );

  // 45 — Start with the reference risk of 10%.
  await until(S(45));
  await play(
    ...outs([
      creditFrame,
      creditUnits,
      ...callBars,
      ...pipeBars
    ]),
    new M.FadeIn(finalTitle),
    new M.FadeIn(finalTrack),
    new M.FadeIn(finalScale),
    new M.FadeIn(referenceSegment),
    ...fbox([
      ['Start with the reference: 10%', REF_COLOR]
    ]),
    ...say('START WITH THE 10% REFERENCE')
  );

  // 46 — Extend the bar by 50 points for calls.
  await until(S(46));
  await play(
    new M.FadeIn(callsSegment),
    ...fbox([
      ['Reference: 10%', REF_COLOR],
      ['Calls: +50 percentage points', CALL_COLOR],
      ['Running total: 60%', RISK_COLOR]
    ]),
    ...say('ADD 50 POINTS FOR CALLS')
  );

  // 47 — Extend the bar by 30 points for the older pipe.
  await until(S(47));
  await play(
    new M.FadeIn(pipeSegment),
    ...fbox([
      ['Reference: 10%', REF_COLOR],
      ['Calls: +50 points', CALL_COLOR],
      ['Older pipe: +30 points', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('ADD 30 POINTS FOR THE OLDER PIPE', PIPE_COLOR)
  );

  // ------------------------------------------------------------
  // Mark the reconstructed final prediction at 90%.
  // ------------------------------------------------------------

  const finalRiskX = finalX(HOME_A.risk);

  const finalRiskLine = new M.DashedLine({
    start: [
      finalRiskX,
      FINAL_BAR_Y - FINAL_BAR_H / 2 - 0.15,
      0
    ],
    end: [
      finalRiskX,
      FINAL_BAR_Y + FINAL_BAR_H / 2 + 0.62,
      0
    ],
    color: RISK_COLOR,
    strokeWidth: 2.5
  });

  const finalRiskTag = pill(
    'HOME A: 90%',
    RISK_COLOR,
    P ? 19 : 21
  );

  // above the end of the dashed 90% line, clear of the "+30 points" label
  finalRiskTag.moveTo([
    Math.min(finalRiskX, FW / 2 - 0.25 - finalRiskTag.getWidth() / 2),
    FINAL_BAR_Y + FINAL_BAR_H / 2 + 0.62 + 0.27,
    0
  ]);

  // 48 — Together they reconstruct Home A's predicted risk.
  await until(S(48));
  await play(
    new M.Create(finalRiskLine),
    new M.FadeIn(finalRiskTag),
    ...fbox([
      ['10% + 50 points + 30 points', C.ink],
      ['= 90% predicted risk', RISK_COLOR]
    ], RISK_COLOR),
    ...say('TOGETHER THEY RECONSTRUCT 90%', RISK_COLOR)
  );

  // ------------------------------------------------------------
  // Formula — after the two paths and the visual reconstruction.
  // ------------------------------------------------------------

  // 49 — Introduce one short formula.
  await until(S(49));
  await play(
    ...fbox([
      ['For each feature:', C.ink],
      'Add its contributions across all orders',
      ['Then divide by the number of orders', RISK_COLOR]
    ]),
    ...say('ONE SHORT FORMULA')
  );

  // 50 — Shapley attribution = sum of contributions / orders.
  await until(S(50));
  await play(
    ...fbox([
      ['Shapley attribution', PIPE_COLOR],
      '= sum of a feature’s contributions',
      ['  ÷ number of possible orders', RISK_COLOR]
    ], PIPE_COLOR),
    ...say('SHAPLEY ATTRIBUTION = MEAN CONTRIBUTION', PIPE_COLOR)
  );

  // ------------------------------------------------------------
  // Interpretation and limitations.
  //
  // Attributions are relative to the chosen reference.
  // They describe the trained model, not the physical causes
  // of the water problem.
  // ------------------------------------------------------------

  // 51 — Explain each feature's contribution relative to a reference.
  await until(S(51));
  await play(
    new M.Indicate(
      referenceSegment,
      { color: C.ink }
    ),
    new M.Indicate(
      callsSegment,
      { color: CALL_COLOR }
    ),
    new M.Indicate(
      pipeSegment,
      { color: PIPE_COLOR }
    ),
    ...fbox([
      ['Compared with our chosen reference:', REF_COLOR],
      ['Calls explain +50 points', CALL_COLOR],
      ['Older pipe explains +30 points', PIPE_COLOR]
    ]),
    ...say('EXPLAIN ONE PREDICTION RELATIVE TO A REFERENCE')
  );

  // 52 — Different references can change the contributions.
  await until(S(52));

  const referenceFocus = rect(
    finalX(REFERENCE.risk) - finalX(0) + 0.12,
    FINAL_BAR_H + 0.14,
    [
      (finalX(0) + finalX(REFERENCE.risk)) / 2,
      FINAL_BAR_Y,
      0
    ],
    CHANGE_COLOR,
    0,
    2.6,
    0.09
  );

  await play(
    new M.Create(referenceFocus),
    new M.Indicate(
      referenceSegment,
      { color: CHANGE_COLOR }
    ),
    ...fbox([
      ['A different starting point', CHANGE_COLOR],
      'can give different feature contributions',
      ['Always state the chosen reference', C.ink]
    ], CHANGE_COLOR),
    ...say('THE REFERENCE MATTERS', CHANGE_COLOR)
  );

  // 53 — Contributions explain predictions, not real-world causes.
  await until(S(53));
  await play(
    new M.FadeOut(referenceFocus),
    ...fbox([
      ['Explains the model’s prediction', CALL_COLOR],
      ['Does not establish what causes the water problem', CHANGE_COLOR]
    ], CHANGE_COLOR),
    ...say('MODEL EXPLANATION IS NOT CAUSATION', CHANGE_COLOR)
  );

  // ------------------------------------------------------------
  // Final summary.
  //
  // Keep the reconstructed prediction visible.
  // Show the two averaged contributions alongside the formula.
  // ------------------------------------------------------------

  // 54 — Share credit by averaging across every possible order.
  await until(S(54));
  await play(
    new M.LaggedStart([
      new M.Indicate(
        referenceSegment,
        { color: C.ink }
      ),
      new M.Indicate(
        callsSegment,
        { color: CALL_COLOR }
      ),
      new M.Indicate(
        pipeSegment,
        { color: PIPE_COLOR }
      ),
      new M.Indicate(
        finalRiskTag,
        { color: RISK_COLOR }
      )
    ], { lagRatio: 0.16, runTime: 2.0 }),
    ...fbox([
      ['Calls: (40 + 60) ÷ 2 = 50 points', CALL_COLOR],
      ['Pipe:  (40 + 20) ÷ 2 = 30 points', PIPE_COLOR],
      ['10% + 50 points + 30 points = 90%', RISK_COLOR]
    ], RISK_COLOR),
    ...say('SHAPLEY: AVERAGE CREDIT ACROSS EVERY ORDER', RISK_COLOR)
  );
}
