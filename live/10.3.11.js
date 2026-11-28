// lesson 10.3.11
// Cox regression: proportional hazards and the hazard ratio.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Shared chapter example:
//                 Week 1    Week 2    Week 3
// No phone call     10%       10%        5%
// Phone call        20%       20%       10%
//
// Weekly probability ratios = 2, 2, 2.
// Illustrative Cox coefficient = ln(2) ≈ 0.69.
// Cox hazard ratio = exp(coefficient) = 2.
//
// After two weeks:
// No call: 0.9 × 0.9 = 0.81 still waiting; 19% completed.
// Call:    0.8 × 0.8 = 0.64 still waiting; 36% completed.
// Cumulative probability ratio = 36/19 ≈ 1.9, not 2.
//
// Weekly probabilities illustrate the multiplier idea;
// continuous-time hazards are instantaneous rates, not probabilities.
// Dot arrays represent percentages, not additional observed patients.
// The original Log 4 has no supplied phone-call assignments.
// Uses the supplied engine interface; browser rendering has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play,
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data.
  // ------------------------------------------------------------

  const WEEKS = [
    { week: 1, noCall: 0.10, call: 0.20 },
    { week: 2, noCall: 0.10, call: 0.20 },
    { week: 3, noCall: 0.05, call: 0.10 },
  ];

  const LOG4 = [
    { name: 'Amal',  week: 2,  event: true },
    { name: 'Badr',  week: 3,  event: true },
    { name: 'Chen',  week: 4,  event: false },
    { name: 'Dina',  week: 6,  event: true },
    { name: 'Eli',   week: 7,  event: false },
    { name: 'Farah', week: 9,  event: true },
    { name: 'Gus',   week: 12, event: false },
    { name: 'Hana',  week: 12, event: false },
  ];

  const BETA = Math.log(2);
  const HR = Math.exp(BETA);

  const NO_CALL_STILL =
    (1 - WEEKS[0].noCall) *
    (1 - WEEKS[1].noCall);

  const CALL_STILL =
    (1 - WEEKS[0].call) *
    (1 - WEEKS[1].call);

  const NO_CALL_DONE = 1 - NO_CALL_STILL;
  const CALL_DONE = 1 - CALL_STILL;

  const CUMULATIVE_RATIO =
    CALL_DONE / NO_CALL_DONE;

  const pct = value =>
    `${Math.round(value * 100)}%`;

  // Clinic outcome colours.
  const TEAL = C.teal || '#40D9C2';
  const RED = C.red || '#F87181';
  const PINK = C.pink || '#F472B6';

  // Group identification colours.
  // Actual follow-up outcomes still use teal and soft red.
  const NO_CALL_COLOR = C.cyan;
  const CALL_COLOR = C.violet;

  const CX = P ? 0 : -2.60;

  const PILL = P
    ? [0, 2.05, 0]
    : [CX, 1.90, 0];

  const BOXP = P
    ? [0, 3.35, 0]
    : [4.25, -0.15, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Basic visual helpers.
  //
  // Position each component before creating its VGroup.
  // Never regroup already-visible objects.
  // ------------------------------------------------------------

  function textAt(
    s,
    size,
    color,
    pos,
    mono = false,
    maxWidth = null,
  ) {
    const t = T(s, size, color, mono);

    if (maxWidth && t.getWidth() > maxWidth) {
      t.scale(maxWidth / t.getWidth());
    }

    t.moveTo(pos);

    return t;
  }

  function line(
    a,
    b,
    color = C.muted,
    width = 2,
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: width,
    });
  }

  function dash(
    a,
    b,
    color = C.muted,
  ) {
    return new M.DashedLine({
      start: a,
      end: b,
      color,
    });
  }

  function rect(
    w,
    h,
    pos,
    color,
    fill = C.card,
    opacity = 0.95,
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2,
    });

    r.setFill(fill, opacity);
    r.moveTo(pos);

    return r;
  }

  function block(
    w,
    h,
    pos,
    color,
    opacity = 0.75,
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1,
    });

    r.setFill(color, opacity);
    r.moveTo(pos);

    return r;
  }

  function dot(
    p,
    color = RED,
    radius = 0.085,
    opacity = 1,
  ) {
    const d = new M.Dot({
      point: p,
      radius,
      color,
    });

    d.setFill(color, opacity);

    return d;
  }

  function glow(
    p,
    color = TEAL,
    radius = 0.09,
  ) {
    const halo = new M.Dot({
      point: p,
      radius: radius * 1.95,
      color,
    });

    halo.setFill(color, 0.15);

    return new M.VGroup(
      halo,
      dot(p, color, radius),
    );
  }

  function ring(
    p,
    radius,
    color,
    width = 2.5,
  ) {
    const r = new M.Circle({
      radius,
      color,
      strokeWidth: width,
    });

    r.setFill(color, 0);
    r.moveTo(p);

    return r;
  }

  function tagAt(
    s,
    color,
    p,
    size = 17,
  ) {
    const t = pill(
      s,
      color,
      P ? size - 1 : size,
    );

    t.moveTo(p);

    return t;
  }

  function arrow(
    a,
    b,
    color = C.amber,
    width = 3,
  ) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.hypot(dx, dy) || 1;

    const ux = dx / length;
    const uy = dy / length;

    const h = Math.min(
      0.14,
      length * 0.35,
    );

    const w = h * 0.55;

    const left = [
      b[0] - h * ux - w * uy,
      b[1] - h * uy + w * ux,
      0,
    ];

    const right = [
      b[0] - h * ux + w * uy,
      b[1] - h * uy - w * ux,
      0,
    ];

    return new M.VGroup(
      line(a, b, color, width),
      line(b, left, color, width),
      line(b, right, color, width),
    );
  }

  function fadeInAll(...objects) {
    return objects
      .filter(Boolean)
      .map(o =>
        new M.FadeIn(o, { runTime: 0.40 })
      );
  }

  function fadeOutAll(...objects) {
    return objects
      .filter(Boolean)
      .map(o =>
        new M.FadeOut(o, { runTime: 0.30 })
      );
  }

  // ------------------------------------------------------------
  // Formula / explanation panel.
  //
  // Phone: above the main picture.
  // Laptop: to the right of the main picture.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const animations = [];

    if (boxNow) {
      animations.push(
        new M.FadeOut(
          boxNow,
          { runTime: 0.30 },
        )
      );
    }

    boxNow = null;

    if (!lines) {
      return animations;
    }

    const size = P ? 21 : 20;
    const lh = P ? 0.39 : 0.43;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T(
        '0000000000',
        size,
        C.ink,
        true,
      ).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const s = rows[i][0];

      const indent =
        cw * (s.length - s.trimStart().length);

      return t.getWidth() + indent;
    });

    const wd = Math.max(...widths) + 0.64;
    const ht = rows.length * lh + 0.36;

    const r = rect(
      wd,
      ht,
      BOXP,
      color,
    );

    const left =
      BOXP[0] - wd / 2 + 0.32;

    const top =
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];

      const indent =
        cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0,
      ]);
    });

    const g = new M.VGroup(
      r,
      ...texts,
    );

    const maxw = P
      ? FW - 1.10
      : 4.35;

    const maxh = P
      ? 1.72
      : 3.45;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht,
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    animations.push(
      new M.FadeIn(
        g,
        { runTime: 0.40 },
      )
    );

    boxNow = g;

    return animations;
  }

  // ------------------------------------------------------------
  // Track the main picture and its temporary annotations.
  // Every transition produces animations for one awaited play().
  // ------------------------------------------------------------

  let pictureNow = [];
  let marksNow = [];

  function picture(...objects) {
    const next = objects.filter(Boolean);

    const animations = [
      ...fadeOutAll(
        ...pictureNow,
        ...marksNow,
      ),
      ...fadeInAll(...next),
    ];

    pictureNow = next;
    marksNow = [];

    return animations;
  }

  function addPicture(...objects) {
    const next = objects.filter(Boolean);

    pictureNow.push(...next);

    return fadeInAll(...next);
  }

  function marks(...objects) {
    const next = objects.filter(Boolean);

    const animations = [
      ...fadeOutAll(...marksNow),
      ...fadeInAll(...next),
    ];

    marksNow = next;

    return animations;
  }

  // ------------------------------------------------------------
  // Patient and phone icons.
  // ------------------------------------------------------------

  function patient(
    p,
    color = RED,
    scale = 1,
  ) {
    const head = new M.Circle({
      radius: 0.14 * scale,
      color,
    });

    head.setFill(color, 1);

    head.moveTo([
      p[0],
      p[1] + 0.20 * scale,
      0,
    ]);

    const body = new M.Arc({
      radius: 0.25 * scale,
      startAngle: 0,
      angle: Math.PI,
      color,
    });

    body.setFill(color, 0.85);

    body.moveTo([
      p[0],
      p[1] - 0.05 * scale,
      0,
    ]);

    return new M.VGroup(
      head,
      body,
    );
  }

  function phoneIcon(
    p,
    color = CALL_COLOR,
    crossed = false,
  ) {
    const parts = [];

    const shell = rect(
      0.53,
      0.90,
      p,
      color,
      color,
      0.10,
    );

    const screen = block(
      0.37,
      0.57,
      [
        p[0],
        p[1] + 0.07,
        0,
      ],
      color,
      0.08,
    );

    const button = dot(
      [
        p[0],
        p[1] - 0.33,
        0,
      ],
      color,
      0.035,
    );

    parts.push(
      shell,
      screen,
      button,
    );

    if (crossed) {
      parts.push(
        line(
          [
            p[0] - 0.38,
            p[1] - 0.47,
            0,
          ],
          [
            p[0] + 0.38,
            p[1] + 0.47,
            0,
          ],
          color,
          3.5,
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Opening comparison.
  // The icons identify groups, not recorded sample sizes.
  // ------------------------------------------------------------

  function introCard(
    label,
    color,
    x,
    called,
  ) {
    const y = P ? -0.90 : -0.30;

    const w = P ? 2.60 : 2.75;
    const h = P ? 2.80 : 2.60;

    const parts = [
      rect(
        w,
        h,
        [x, y, 0],
        color,
      ),

      textAt(
        label,
        22,
        color,
        [
          x,
          y + h / 2 - 0.32,
          0,
        ],
      ),

      phoneIcon(
        [
          x,
          y + 0.29,
          0,
        ],
        color,
        !called,
      ),
    ];

    for (let i = 0; i < 3; i++) {
      parts.push(
        patient(
          [
            x + (i - 1) * 0.61,
            y - 0.65,
            0,
          ],
          RED,
          0.85,
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const introNoCall = introCard(
    'NO CALL',
    NO_CALL_COLOR,
    CX - 1.48,
    false,
  );

  const introCall = introCard(
    'PHONE CALL',
    CALL_COLOR,
    CX + 1.48,
    true,
  );

  const introQuestion = textAt(
    'Who gets their follow-up sooner?',
    21,
    C.ink,
    [
      CX,
      P ? -2.80 : -2.12,
      0,
    ],
    false,
    P ? FW - 0.9 : 6.0,
  );

  // ------------------------------------------------------------
  // 0: compare follow-up waits in the two groups.
  // ------------------------------------------------------------

  await until(S(0));
  await play(
    ...picture(
      introNoCall,
      introCall,
      introQuestion,
    ),
    ...say(
      'PHONE CALL VS NO PHONE CALL',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // Weekly percentage rows.
  //
  // Each row has 20 dots.
  // One dot represents 5% of the patients still waiting
  // at the beginning of the selected week.
  //
  // The denominator is deliberately reset each week.
  // These are percentage units, not twenty actual patients.
  //
  // Soft red = still waiting.
  // Teal = follow-up happened during this week.
  // ------------------------------------------------------------

  const UNIT_COUNT = 20;

  const ROW_TOP = P ? 0.10 : 0.60;
  const ROW_BOTTOM = P ? -2.10 : -1.10;

  const ROW_WIDTH = P ? 5.20 : 5.45;
  const UNIT_SPACING = ROW_WIDTH / UNIT_COUNT;

  const ROW_X0 = CX - ROW_WIDTH / 2;

  function unitX(i) {
    return ROW_X0 +
      (i + 0.5) * UNIT_SPACING;
  }

  function weeklyRow(
    label,
    groupColor,
    y,
    eventShare = null,
    highlight = false,
  ) {
    const count =
      eventShare === null
        ? 0
        : Math.round(eventShare * UNIT_COUNT);

    const parts = [];

    const frame = rect(
      ROW_WIDTH + 0.22,
      P ? 1.45 : 1.25,
      [
        CX,
        y,
        0,
      ],
      highlight
        ? C.amber
        : groupColor,
      C.card,
      highlight ? 0.82 : 0.45,
    );

    parts.push(frame);

    parts.push(
      textAt(
        label,
        19,
        groupColor,
        [
          CX - 1.58,
          y + (P ? 0.47 : 0.39),
          0,
        ],
        false,
        2.0,
      )
    );

    const outcomeLabel =
      eventShare === null
        ? 'Still waiting'
        : `${pct(eventShare)} get follow-up`;

    parts.push(
      textAt(
        outcomeLabel,
        16,
        eventShare === null
          ? RED
          : TEAL,
        [
          CX + 1.00,
          y + (P ? 0.47 : 0.39),
          0,
        ],
        false,
        2.85,
      )
    );

    for (let i = 0; i < UNIT_COUNT; i++) {
      const completed = i < count;

      const p = [
        unitX(i),
        y - 0.03,
        0,
      ];

      parts.push(
        completed
          ? glow(p, TEAL, 0.078)
          : dot(p, RED, 0.078)
      );
    }

    // A proportional strip reinforces the same percentages.
    // Its full width represents the current risk set.
    const stripY =
      y - (P ? 0.40 : 0.37);

    const full = block(
      ROW_WIDTH,
      0.13,
      [CX, stripY, 0],
      RED,
      0.58,
    );

    parts.push(full);

    if (count > 0) {
      const completedWidth =
        ROW_WIDTH * count / UNIT_COUNT;

      parts.push(
        block(
          completedWidth,
          0.13,
          [
            ROW_X0 + completedWidth / 2,
            stripY,
            0,
          ],
          TEAL,
          0.95,
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function weeklyPicture(
    week,
    revealNoCall = false,
    revealCall = false,
    highlight = null,
  ) {
    const d = WEEKS[week - 1];

    const heading = tagAt(
      `WEEK ${week}`,
      C.amber,
      [
        CX,
        P ? 1.38 : 1.48,
        0,
      ],
      18,
    );

    const noCallRow = weeklyRow(
      'No call',
      NO_CALL_COLOR,
      ROW_TOP,
      revealNoCall ? d.noCall : null,
      highlight === 'noCall' ||
        highlight === 'both',
    );

    const callRow = weeklyRow(
      'Phone call',
      CALL_COLOR,
      ROW_BOTTOM,
      revealCall ? d.call : null,
      highlight === 'call' ||
        highlight === 'both',
    );

    const keyY = P ? -3.40 : -2.12;

    const key = new M.VGroup(
      dot(
        [CX - 2.40, keyY, 0],
        RED,
        0.08,
      ),

      textAt(
        'Waiting',
        15,
        RED,
        [CX - 1.67, keyY, 0],
      ),

      dot(
        [CX + 0.05, keyY, 0],
        TEAL,
        0.08,
      ),

      textAt(
        'Follow-up',
        15,
        TEAL,
        [CX + 1.00, keyY, 0],
      ),
    );

    const unitNote = textAt(
      'Each dot = 5% of that week’s waiting group',
      15,
      C.muted,
      [
        CX,
        P ? -3.91 : -2.58,
        0,
      ],
      false,
      ROW_WIDTH + 0.45,
    );

    return {
      heading,
      noCallRow,
      callRow,
      key,
      unitNote,
    };
  }

  function weeklyObjects(w) {
    return [
      w.heading,
      w.noCallRow,
      w.callRow,
      w.key,
      w.unitNote,
    ];
  }

  let weekly = weeklyPicture(
    1,
    false,
    false,
  );

  // ------------------------------------------------------------
  // 1: two rows, one for each group.
  // ------------------------------------------------------------

  await until(S(1));
  await play(
    ...picture(...weeklyObjects(weekly)),
    ...say(
      'TWO ROWS OF WAITING PATIENTS',
      RED,
    ),
  );

  // ------------------------------------------------------------
  // 2: focus on the people still waiting at the start
  // of each week.
  // ------------------------------------------------------------

  const waitingOutline1 = rect(
    ROW_WIDTH + 0.04,
    0.39,
    [CX, ROW_TOP - 0.03, 0],
    C.amber,
    C.amber,
    0,
  );

  const waitingOutline2 = rect(
    ROW_WIDTH + 0.04,
    0.39,
    [CX, ROW_BOTTOM - 0.03, 0],
    C.amber,
    C.amber,
    0,
  );

  await until(S(3));
  await play(
    ...marks(
      waitingOutline1,
      waitingOutline2,
    ),
    ...fbox([
      ['At the start of a week', C.amber],
      'Look only at people',
      ['still waiting.', RED],
    ], C.amber),
    ...say(
      'FOCUS ON THE CURRENT WAITING GROUP',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 3: week 1, no-call group.
  // 10% of those currently waiting receive follow-up.
  // Two of twenty percentage units turn teal.
  // ------------------------------------------------------------

  weekly = weeklyPicture(
    1,
    true,
    false,
    'noCall',
  );

  await until(S(4));
  await play(
    ...picture(...weeklyObjects(weekly)),
    ...fbox([
      ['Week 1: no call', NO_CALL_COLOR],
      ['10% get follow-up', TEAL],
      ['90% stay waiting', RED],
    ], NO_CALL_COLOR),
    ...say(
      'NO CALL: 10% GET THEIR VISIT',
      TEAL,
    ),
  );

  // ------------------------------------------------------------
  // 4: week 1, phone-call group.
  // 20% of those currently waiting receive follow-up.
  // Four of twenty percentage units turn teal.
  // ------------------------------------------------------------

  weekly = weeklyPicture(
    1,
    true,
    true,
    'call',
  );

  await until(S(5));
  await play(
    ...picture(...weeklyObjects(weekly)),
    ...fbox([
      ['Week 1: phone call', CALL_COLOR],
      ['20% get follow-up', TEAL],
      ['80% stay waiting', RED],
    ], CALL_COLOR),
    ...say(
      'PHONE CALL: 20% GET THEIR VISIT',
      TEAL,
    ),
  );

  // ------------------------------------------------------------
  // 5: week 2 has the same conditional probabilities.
  //
  // Each row is normalized to that week's remaining
  // waiting patients, not the original starting group.
  // ------------------------------------------------------------

  weekly = weeklyPicture(
    2,
    true,
    true,
    'both',
  );

  await until(S(6));
  await play(
    ...picture(...weeklyObjects(weekly)),
    ...fbox([
      ['Week 2', C.amber],
      ['No call: 10%', NO_CALL_COLOR],
      ['Call:    20%', CALL_COLOR],
      'Of those still waiting',
    ]),
    ...say(
      'WEEK 2: THE SAME TWO WEEKLY SHARES',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 6: week 3, no-call probability falls to 5%.
  // ------------------------------------------------------------

  weekly = weeklyPicture(
    3,
    true,
    false,
    'noCall',
  );

  await until(S(8));
  await play(
    ...picture(...weeklyObjects(weekly)),
    ...fbox([
      ['Week 3: no call', NO_CALL_COLOR],
      'Previous weeks: 10%',
      ['Now: 5%', TEAL],
    ], NO_CALL_COLOR),
    ...say(
      'WEEK 3: NO CALL FALLS TO 5%',
      NO_CALL_COLOR,
    ),
  );

  // ------------------------------------------------------------
  // 7: week 3, phone-call probability also halves.
  // ------------------------------------------------------------

  weekly = weeklyPicture(
    3,
    true,
    true,
    'call',
  );

  await until(S(9));
  await play(
    ...picture(...weeklyObjects(weekly)),
    ...fbox([
      ['Week 3: phone call', CALL_COLOR],
      'Previous weeks: 20%',
      ['Now: 10%', TEAL],
    ], CALL_COLOR),
    ...say(
      'PHONE CALL FALLS TO 10%',
      CALL_COLOR,
    ),
  );

  // ------------------------------------------------------------
  // Paired weekly probability chart.
  //
  // Group colours identify no-call and phone-call bars.
  // The vertical scale is a weekly conditional probability.
  // This is not yet an instantaneous hazard plot.
  // ------------------------------------------------------------

  const WX0 = CX - (P ? 2.60 : 2.80);
  const WX1 = CX + (P ? 2.65 : 2.90);

  const WY0 = P ? -3.80 : -2.10;
  const WY1 = P ? 0.82 : 1.16;

  const WMAX = 0.25;

  const WEEK_SP = (WX1 - WX0) / 3;

  const weekX = w =>
    WX0 + (w - 0.5) * WEEK_SP;

  const chanceY = q =>
    WY0 + q / WMAX * (WY1 - WY0);

  function weeklyAxes() {
    const parts = [];

    [
      0,
      0.05,
      0.10,
      0.15,
      0.20,
      0.25,
    ].forEach(q => {
      const y = chanceY(q);

      parts.push(
        line(
          [WX0, y, 0],
          [WX1, y, 0],
          C.muted,
          0.65,
        )
      );

      const lab = T(
        pct(q),
        15,
        C.muted,
        true,
      );

      lab.moveTo([
        WX0 - 0.13 - lab.getWidth() / 2,
        y,
        0,
      ]);

      parts.push(lab);
    });

    for (let w = 1; w <= 3; w++) {
      parts.push(
        textAt(
          `Week ${w}`,
          16,
          C.muted,
          [
            weekX(w),
            WY0 - 0.26,
            0,
          ],
        )
      );
    }

    parts.push(
      line(
        [WX0, WY0, 0],
        [WX1, WY0, 0],
        C.muted,
        2.2,
      ),

      line(
        [WX0, WY0, 0],
        [WX0, WY1, 0],
        C.muted,
        2.2,
      ),

      textAt(
        'Chance of follow-up this week',
        17,
        C.ink,
        [
          CX,
          WY1 + 0.28,
          0,
        ],
        false,
        WX1 - WX0 + 0.35,
      ),
    );

    return new M.VGroup(...parts);
  }

  function chanceBar(
    w,
    q,
    side,
    color,
  ) {
    const bw = WEEK_SP * 0.29;

    const x =
      weekX(w) +
      side * WEEK_SP * 0.17;

    const height = chanceY(q) - WY0;

    const bar = block(
      bw,
      height,
      [
        x,
        WY0 + height / 2,
        0,
      ],
      color,
      0.75,
    );

    const label = textAt(
      pct(q),
      16,
      color,
      [
        x,
        chanceY(q) + 0.19,
        0,
      ],
      true,
    );

    return new M.VGroup(
      bar,
      label,
    );
  }

  function weeklyPair(w) {
    const d = WEEKS[w - 1];

    return new M.VGroup(
      chanceBar(
        w,
        d.noCall,
        -1,
        NO_CALL_COLOR,
      ),

      chanceBar(
        w,
        d.call,
        1,
        CALL_COLOR,
      ),
    );
  }

  function weeklyLegend() {
    const y = P ? -4.53 : -2.73;

    return new M.VGroup(
      block(
        0.18,
        0.18,
        [CX - 2.07, y, 0],
        NO_CALL_COLOR,
      ),

      textAt(
        'No call',
        15,
        NO_CALL_COLOR,
        [CX - 1.35, y, 0],
      ),

      block(
        0.18,
        0.18,
        [CX + 0.28, y, 0],
        CALL_COLOR,
      ),

      textAt(
        'Phone call',
        15,
        CALL_COLOR,
        [CX + 1.35, y, 0],
      ),
    );
  }

  function weeklyChart() {
    const axes = weeklyAxes();

    const pairs = [
      weeklyPair(1),
      weeklyPair(2),
      weeklyPair(3),
    ];

    return {
      axes,
      pairs,
      legend: weeklyLegend(),
    };
  }

  function weeklyChartObjects(chart) {
    return [
      chart.axes,
      ...chart.pairs,
      chart.legend,
    ];
  }

  function pairOutline(
    week,
    color = C.amber,
  ) {
    const height =
      chanceY(0.24) - WY0;

    return rect(
      WEEK_SP * 0.89,
      height + 0.10,
      [
        weekX(week),
        WY0 + height / 2,
        0,
      ],
      color,
      color,
      0,
    );
  }

  function ratioTag(
    week,
    color = C.green,
  ) {
    return tagAt(
      '×2',
      color,
      [
        weekX(week),
        chanceY(
          WEEKS[week - 1].call
        ) + 0.53,
        0,
      ],
      18,
    );
  }

  let chart = weeklyChart();

  // ------------------------------------------------------------
  // 8: compare the two groups within the same week.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...picture(...weeklyChartObjects(chart)),
    ...marks(pairOutline(1)),
    ...fbox([
      'Compare within',
      ['the same week.', C.amber],
      'Call ÷ no call',
    ], C.amber),
    ...say(
      'COMPARE THE GROUPS IN THE SAME WEEK',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 9: weeks 1 and 2 both give 20 ÷ 10 = 2.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...marks(
      pairOutline(1),
      pairOutline(2),
      ratioTag(1),
      ratioTag(2),
    ),
    ...fbox([
      ['Weeks 1 and 2', C.amber],
      '20% ÷ 10%',
      ['= 2', C.green],
    ], C.green),
    ...say(
      '20 DIVIDED BY 10 IS 2',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // 10: week 3 gives 10 ÷ 5 = 2.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...marks(
      pairOutline(3),
      ratioTag(3),
    ),
    ...fbox([
      ['Week 3', C.amber],
      '10% ÷ 5%',
      ['= 2', C.green],
    ], C.green),
    ...say(
      '10 DIVIDED BY 5 IS ALSO 2',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // 11: the weekly chances change, but the multiplier
  // in this illustrative example stays constant.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    ...marks(
      ratioTag(1),
      ratioTag(2),
      ratioTag(3),
    ),
    ...fbox([
      'The chances change',
      ['The ratio stays 2', C.green],
      'Week 1: 2',
      'Week 2: 2',
      'Week 3: 2',
    ], C.green),
    ...say(
      'DIFFERENT CHANCES · SAME MULTIPLIER',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // Instantaneous hazard picture.
  //
  // The dots and arrows below are schematic.
  // They illustrate the rate at which follow-ups happen
  // among patients still waiting at one moment.
  //
  // Arrow lengths are relative speeds, not event probabilities.
  // ------------------------------------------------------------

  const MX0 = CX - 2.70;
  const MX1 = CX + 2.70;

  const MOMENT_TOP = P ? 0.15 : 0.53;
  const MOMENT_BOTTOM = P ? -1.85 : -1.12;

  function momentTimeLine() {
    const y = P ? -3.42 : -2.30;

    const x = CX + 0.15;

    const parts = [
      line(
        [MX0, y, 0],
        [MX1, y, 0],
        C.muted,
        2,
      ),

      line(
        [
          x,
          y - 0.09,
          0,
        ],
        [
          x,
          y + 0.09,
          0,
        ],
        C.amber,
        3,
      ),

      dot(
        [x, y, 0],
        C.amber,
        0.065,
      ),

      textAt(
        'One moment',
        17,
        C.amber,
        [
          x,
          y - 0.30,
          0,
        ],
      ),

      textAt(
        'Time',
        15,
        C.muted,
        [
          MX1 - 0.20,
          y - 0.30,
          0,
        ],
      ),
    ];

    return new M.VGroup(...parts);
  }

  function momentRow(
    label,
    groupColor,
    y,
    relativeSpeed = 1,
    showFlow = true,
  ) {
    const parts = [];

    parts.push(
      textAt(
        label,
        19,
        groupColor,
        [
          CX - 1.40,
          y + 0.53,
          0,
        ],
      )
    );

    parts.push(
      rect(
        3.05,
        0.64,
        [
          CX - 1.12,
          y,
          0,
        ],
        RED,
        C.card,
        0.55,
      )
    );

    const count = 8;

    for (let i = 0; i < count; i++) {
      parts.push(
        dot(
          [
            CX - 1.12 +
              (i - (count - 1) / 2) * 0.35,
            y,
            0,
          ],
          RED,
          0.085,
        )
      );
    }

    if (showFlow) {
      const start = [
        CX + 0.48,
        y,
        0,
      ];

      const end = [
        start[0] + 0.82 * relativeSpeed,
        y,
        0,
      ];

      parts.push(
        arrow(
          start,
          end,
          TEAL,
          4,
        )
      );

      parts.push(
        glow(
          [
            end[0] + 0.22,
            y,
            0,
          ],
          TEAL,
          0.095,
        )
      );

      parts.push(
        textAt(
          relativeSpeed === 1
            ? '1× speed'
            : `${relativeSpeed}× speed`,
          15,
          TEAL,
          [
            (start[0] + end[0]) / 2,
            y - 0.40,
            0,
          ],
          true,
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function momentPicture(
    showFlow = true,
    showTitle = true,
  ) {
    const parts = [
      momentRow(
        'No call',
        NO_CALL_COLOR,
        MOMENT_TOP,
        1,
        showFlow,
      ),

      momentRow(
        'Phone call',
        CALL_COLOR,
        MOMENT_BOTTOM,
        2,
        showFlow,
      ),

      momentTimeLine(),
    ];

    if (showTitle) {
      parts.push(
        textAt(
          'Follow-up speed at a moment',
          20,
          C.ink,
          [
            CX,
            P ? 1.37 : 1.52,
            0,
          ],
          false,
          5.90,
        )
      );
    }

    if (P) {
      parts.push(
        textAt(
          'Schematic rates, not weekly probabilities',
          15,
          C.muted,
          [
            CX,
            -4.33,
            0,
          ],
          false,
          6.10,
        )
      );
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 12: move from a whole-week observation to a moment
  // on the waiting-time timeline.
  // ------------------------------------------------------------

  await until(S(15));
  await play(
    ...picture(...momentPicture(false)),
    ...fbox(null),
    ...say(
      'NOW LOOK AT ONE MOMENT IN TIME',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 13: define the hazard.
  //
  // The instantaneous rate of follow-up among people
  // who are still waiting.
  // ------------------------------------------------------------

  await until(S(16));
  await play(
    ...picture(...momentPicture(true)),
    ...fbox([
      ['HAZARD', C.amber],
      'How quickly follow-ups',
      'are happening right now',
      ['among those still waiting.', RED],
    ], C.amber),
    ...say(
      'HAZARD = THE FOLLOW-UP RATE RIGHT NOW',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 14: visualize hazard as the speed at which dots
  // leave the waiting rows.
  // ------------------------------------------------------------

  const fastArrowFocus = rect(
    2.30,
    0.56,
    [
      CX + 1.55,
      MOMENT_BOTTOM,
      0,
    ],
    TEAL,
    TEAL,
    0,
  );

  const slowArrowFocus = rect(
    1.46,
    0.56,
    [
      CX + 1.12,
      MOMENT_TOP,
      0,
    ],
    C.amber,
    C.amber,
    0,
  );

  await until(S(17));
  await play(
    ...marks(
      slowArrowFocus,
      fastArrowFocus,
    ),
    ...fbox([
      ['Still waiting', RED],
      '↓',
      ['Follow-up happens', TEAL],
      'Hazard measures the speed.',
    ], TEAL),
    ...say(
      'THINK OF DOTS LEAVING THE WAITING ROW',
      TEAL,
    ),
  );

  // ------------------------------------------------------------
  // 15: divide one group's hazard by the other's.
  // ------------------------------------------------------------

  const hazardRatioTag = tagAt(
    'HAZARD RATIO = 2',
    C.green,
    [
      CX,
      P ? -2.78 : -1.95,
      0,
    ],
    17,
  );

  await until(S(18));
  await play(
    ...marks(hazardRatioTag),
    ...fbox([
      ['HAZARD RATIO', C.green],
      'Call hazard',
      '÷ no-call hazard',
      ['= 2', C.green],
    ], C.green),
    ...say(
      'DIVIDE THE TWO INSTANTANEOUS RATES',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // Proportional hazard curves.
  //
  // These curves are schematic instantaneous hazards.
  // They are not fitted to the three weekly probabilities.
  //
  // Their only numerical relationship is:
  //   call hazard = 2 × no-call hazard.
  //
  // No invented absolute hazard values are displayed.
  // ------------------------------------------------------------

  const HX0 = CX - (P ? 2.65 : 2.85);
  const HX1 = CX + (P ? 2.65 : 2.90);

  const HY0 = P ? -3.85 : -2.10;
  const HY1 = P ? 0.82 : 1.13;

  const HMAX = 2.5;

  const hazardX = t =>
    HX0 + t * (HX1 - HX0);

  const hazardY = h =>
    HY0 + h / HMAX * (HY1 - HY0);

  const hazardPoint = (t, h) => [
    hazardX(t),
    hazardY(h),
    0,
  ];

  // An illustrative baseline shape.
  // Its values are internal drawing coordinates only.
  function baseline(t) {
    return (
      0.64 +
      0.48 * Math.exp(-1.9 * t) +
      0.10 * Math.sin(2 * Math.PI * t)
    );
  }

  const calledHazard = t =>
    HR * baseline(t);

  function hazardAxes() {
    const parts = [
      line(
        [HX0, HY0, 0],
        [HX1 + 0.07, HY0, 0],
        C.muted,
        2.2,
      ),

      line(
        [HX0, HY0, 0],
        [HX0, HY1, 0],
        C.muted,
        2.2,
      ),

      textAt(
        '0',
        15,
        C.muted,
        [
          HX0 - 0.16,
          HY0,
          0,
        ],
        true,
      ),

      textAt(
        'Instantaneous follow-up rate',
        17,
        C.ink,
        [
          CX,
          HY1 + 0.28,
          0,
        ],
        false,
        HX1 - HX0 + 0.35,
      ),

      textAt(
        'Time since waiting began',
        17,
        C.muted,
        [
          CX,
          HY0 - 0.39,
          0,
        ],
      ),
    ];

    [0.25, 0.50, 0.75].forEach(t => {
      parts.push(
        line(
          [
            hazardX(t),
            HY0,
            0,
          ],
          [
            hazardX(t),
            HY1,
            0,
          ],
          C.muted,
          0.55,
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function sampledCurve(
    fn,
    color,
    from = 0,
    to = 1,
    count = 72,
  ) {
    const segments = [];

    for (let i = 0; i < count; i++) {
      const a =
        from + (to - from) * i / count;

      const b =
        from + (to - from) * (i + 1) / count;

      segments.push(
        line(
          hazardPoint(a, fn(a)),
          hazardPoint(b, fn(b)),
          color,
          4,
        )
      );
    }

    return new M.VGroup(...segments);
  }

  function hazardLegend() {
    const y = P ? -4.72 : -2.77;

    return new M.VGroup(
      line(
        [CX - 2.45, y, 0],
        [CX - 2.03, y, 0],
        NO_CALL_COLOR,
        4,
      ),

      textAt(
        'No call',
        15,
        NO_CALL_COLOR,
        [
          CX - 1.38,
          y,
          0,
        ],
      ),

      line(
        [CX + 0.08, y, 0],
        [CX + 0.50, y, 0],
        CALL_COLOR,
        4,
      ),

      textAt(
        'Phone call',
        15,
        CALL_COLOR,
        [
          CX + 1.48,
          y,
          0,
        ],
      ),
    );
  }

  function hazardComparison(t) {
    const lower = hazardPoint(
      t,
      baseline(t),
    );

    const upper = hazardPoint(
      t,
      calledHazard(t),
    );

    const bottom = hazardPoint(t, 0);

    const parts = [
      dash(
        bottom,
        upper,
        C.amber,
      ),

      glow(
        lower,
        NO_CALL_COLOR,
        0.085,
      ),

      glow(
        upper,
        CALL_COLOR,
        0.085,
      ),

      tagAt(
        '×2',
        C.green,
        [
          lower[0] + 0.33,
          (lower[1] + upper[1]) / 2,
          0,
        ],
        15,
      ),
    ];

    return new M.VGroup(...parts);
  }

  function hazardPicture(
    compareAt = [],
  ) {
    const parts = [
      hazardAxes(),

      sampledCurve(
        baseline,
        NO_CALL_COLOR,
      ),

      sampledCurve(
        calledHazard,
        CALL_COLOR,
      ),

      hazardLegend(),
    ];

    for (const t of compareAt) {
      parts.push(hazardComparison(t));
    }

    const note = textAt(
      'Illustrative shapes',
      15,
      C.muted,
      [
        HX1 - 1.05,
        HY1 - 0.22,
        0,
      ],
    );

    parts.push(note);

    return parts;
  }

  // ------------------------------------------------------------
  // 16: proportional hazards.
  //
  // The two hazards may rise or fall over time.
  // Their ratio remains 2 at every moment in this example.
  // ------------------------------------------------------------

  await until(S(19));
  await play(
    ...picture(
      ...hazardPicture([
        0.14,
        0.49,
        0.84,
      ]),
    ),
    ...fbox([
      ['PROPORTIONAL HAZARDS', C.green],
      'Rates can change',
      ['Their ratio stays the same.', C.green],
    ], C.green),
    ...say(
      'CONSTANT RATIO = PROPORTIONAL HAZARDS',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // 17: name Cox regression.
  // One multiplier compares the groups throughout time.
  // ------------------------------------------------------------


  // ------------------------------------------------------------
  // 18: return briefly to the weekly illustration.
  //
  // Weekly conditional probabilities are useful for intuition,
  // but a probability ratio over a whole week is not generally
  // the same mathematical quantity as a continuous hazard ratio.
  // ------------------------------------------------------------

  chart = weeklyChart();

  await until(S(20));
  await play(
    ...picture(
      ...weeklyChartObjects(chart),
      ratioTag(1),
      ratioTag(2),
      ratioTag(3),
    ),
    ...fbox([
      ['Weekly picture', C.amber],
      'Chances over a whole week',
      'Illustrates the idea',
      'of a constant multiplier.',
    ], C.amber),
    ...say(
      'OUR PERCENTAGE BARS COVER WHOLE WEEKS',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 19: Cox regression compares instantaneous rates.
  // Move back to a single moment on the rate curves.
  // ------------------------------------------------------------

  const MOMENT = 0.49;

  await until(S(21));
  await play(
    ...picture(
      ...hazardPicture([MOMENT]),
    ),
    ...fbox([
      ['Cox regression', C.green],
      'Compare the rates',
      ['at a moment in time.', C.amber],
      'Not whole-week chances.',
    ], C.green),
    ...say(
      'COX COMPARES THE SPEED AT A MOMENT',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // Original shared Log 4 waiting-time bars.
  //
  // These records demonstrate event ordering and risk sets.
  // No phone-call assignments are given for these patients,
  // so none are invented.
  //
  // At week 6, immediately before Dina's follow-up:
  //   Amal and Badr have already had their follow-up.
  //   Chen has been censored.
  //   Dina, Eli, Farah, Gus and Hana form the risk set.
  // ------------------------------------------------------------

  const LX0 = CX - 1.89;
  const LX1 = CX + 2.62;

  const LOG_TOP = P ? 0.70 : 0.83;
  const LOG_SP = P ? 0.52 : 0.36;

  const LOG_AXIS_Y = P ? -3.48 : -2.10;

  const logX = week =>
    LX0 + week / 12 * (LX1 - LX0);

  const logY = i =>
    LOG_TOP - i * LOG_SP;

  function logPicture(eventWeek = 6) {
    const parts = [];

    parts.push(
      textAt(
        'Original clinic waiting log',
        19,
        C.ink,
        [
          CX,
          P ? 1.40 : 1.43,
          0,
        ],
      )
    );

    const currentRisk = LOG4.filter(
      d => d.week >= eventWeek
    );

    LOG4.forEach((d, i) => {
      const y = logY(i);

      const atRisk =
        d.week >= eventWeek;

      const end = [
        logX(d.week),
        y,
        0,
      ];

      const color = d.event
        ? TEAL
        : RED;

      parts.push(
        textAt(
          d.name,
          15,
          atRisk ? C.ink : C.muted,
          [
            CX - 2.60,
            y,
            0,
          ],
          false,
          0.87,
        )
      );

      parts.push(
        line(
          [LX0, y, 0],
          [LX1, y, 0],
          C.muted,
          0.65,
        )
      );

      parts.push(
        line(
          [LX0, y, 0],
          end,
          atRisk ? color : C.muted,
          atRisk ? 3.5 : 2.0,
        )
      );

      if (d.event) {
        parts.push(
          dot(
            end,
            atRisk ? TEAL : C.muted,
            0.075,
          )
        );
      } else {
        parts.push(
          line(
            [
              end[0] - 0.10,
              end[1] + 0.065,
              0,
            ],
            end,
            atRisk ? RED : C.muted,
            2.2,
          ),

          line(
            [
              end[0] - 0.10,
              end[1] - 0.065,
              0,
            ],
            end,
            atRisk ? RED : C.muted,
            2.2,
          ),
        );
      }

      parts.push(
        textAt(
          d.event
            ? String(d.week)
            : `${d.week}+`,
          15,
          atRisk ? color : C.muted,
          [
            end[0] + 0.25,
            y,
            0,
          ],
          true,
        )
      );

      if (atRisk) {
        parts.push(
          ring(
            [
              CX - 3.12,
              y,
              0,
            ],
            0.072,
            C.amber,
            2,
          )
        );
      }

      if (
        d.event &&
        d.week === eventWeek
      ) {
        parts.push(
          ring(
            end,
            0.15,
            C.amber,
            2.6,
          )
        );
      }
    });

    const cursorX = logX(eventWeek);

    parts.push(
      dash(
        [
          cursorX,
          LOG_TOP + 0.19,
          0,
        ],
        [
          cursorX,
          logY(LOG4.length - 1) - 0.18,
          0,
        ],
        C.amber,
      )
    );

    parts.push(
      line(
        [LX0, LOG_AXIS_Y, 0],
        [LX1, LOG_AXIS_Y, 0],
        C.muted,
        1.7,
      )
    );

    [0, 3, 6, 9, 12].forEach(w => {
      parts.push(
        textAt(
          String(w),
          15,
          w === eventWeek
            ? C.amber
            : C.muted,
          [
            logX(w),
            LOG_AXIS_Y - 0.20,
            0,
          ],
          true,
        )
      );
    });

    parts.push(
      tagAt(
        `RISK SET = ${currentRisk.length}`,
        C.amber,
        [
          CX,
          P ? -4.28 : -2.70,
          0,
        ],
        16,
      )
    );

    return new M.VGroup(...parts);
  }

  const logAtWeekSix = logPicture(6);

  // ------------------------------------------------------------
  // 20: Cox regression uses the ordering of events
  // and the people still waiting and watched at each event.
  //
  // The original clinic log illustrates the risk-set idea.
  // It is not used to manufacture the illustrative coefficient.
  // ------------------------------------------------------------

  await until(S(22));
  await play(
    ...picture(logAtWeekSix),
    ...fbox([
      ['Example: Dina, week 6', TEAL],
      'Five in the risk set',
      'Compare who gets the visit',
      'with who was still at risk.',
    ], C.amber),
    ...say(
      'EVENT ORDER AND THE CURRENT RISK SET',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // Baseline-free comparison picture.
  //
  // At different event moments, the unknown baseline can
  // have different heights.
  //
  // The paired bars use symbolic relative-rate units.
  // They illustrate a ratio without estimating or drawing
  // the full baseline hazard function.
  // ------------------------------------------------------------

  function baselineFreePicture() {
    const parts = [];

    parts.push(
      textAt(
        'Compare rates at event moments',
        19,
        C.ink,
        [
          CX,
          P ? 1.35 : 1.43,
          0,
        ],
        false,
        5.90,
      )
    );

    const x0 = CX - 1.63;
    const unit = P ? 1.08 : 1.13;

    const ys = P
      ? [0.12, -1.45, -3.02]
      : [0.55, -0.70, -1.95];

    const illustrativeHeights = [
      1.00,
      0.70,
      1.20,
    ];

    illustrativeHeights.forEach((h, i) => {
      const y = ys[i];

      const noWidth = unit * h;
      const callWidth = unit * h * 2;

      parts.push(
        textAt(
          `Moment ${i + 1}`,
          15,
          C.muted,
          [
            CX - 2.35,
            y,
            0,
          ],
          false,
          1.30,
        ),

        block(
          noWidth,
          0.17,
          [
            x0 + noWidth / 2,
            y + 0.15,
            0,
          ],
          NO_CALL_COLOR,
          0.78,
        ),

        block(
          callWidth,
          0.17,
          [
            x0 + callWidth / 2,
            y - 0.15,
            0,
          ],
          CALL_COLOR,
          0.78,
        ),

        tagAt(
          '×2',
          C.green,
          [
            CX + 1.94,
            y,
            0,
          ],
          16,
        ),
      );
    });

    parts.push(
      textAt(
        'Schematic relative rates',
        15,
        C.muted,
        [
          CX,
          P ? -3.85 : -2.64,
          0,
        ],
      )
    );

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 21: Cox can estimate a relative multiplier without
  // first specifying the entire baseline hazard curve.
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...picture(baselineFreePicture()),
    ...fbox([
      ['Estimate the ratio', C.green],
      'Without specifying',
      'the whole no-call',
      'baseline hazard curve.',
    ], C.green),
    ...say(
      'ESTIMATE THE MULTIPLIER WITHOUT THE WHOLE BASELINE',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // Score-to-hazard-ratio picture.
  //
  // An exponential curve translates a change in score
  // into a hazard multiplier.
  //
  // Exact underlying score increase = ln(2).
  // Rounded display = 0.69.
  // ------------------------------------------------------------

  const EX0 = CX - (P ? 2.55 : 2.80);
  const EX1 = CX + (P ? 2.60 : 2.85);

  const EY0 = P ? -3.80 : -2.05;
  const EY1 = P ? 0.85 : 1.16;

  const SCORE_MIN = -1.35;
  const SCORE_MAX = 1.30;

  const MULT_MAX = 4;

  const scoreX = s =>
    EX0 +
    (s - SCORE_MIN) /
    (SCORE_MAX - SCORE_MIN) *
    (EX1 - EX0);

  const multiplierY = m =>
    EY0 +
    m / MULT_MAX *
    (EY1 - EY0);

  const expPoint = s => [
    scoreX(s),
    multiplierY(Math.exp(s)),
    0,
  ];

  function exponentialAxes() {
    const parts = [];

    [0, 1, 2, 3, 4].forEach(v => {
      const y = multiplierY(v);

      parts.push(
        line(
          [EX0, y, 0],
          [EX1, y, 0],
          C.muted,
          0.65,
        ),

        textAt(
          String(v),
          15,
          C.muted,
          [
            EX0 - 0.22,
            y,
            0,
          ],
          true,
        ),
      );
    });

    [
      [-1, '−1'],
      [0, '0'],
      [BETA, '0.69'],
    ].forEach(([s, label]) => {
      parts.push(
        textAt(
          label,
          16,
          C.muted,
          [
            scoreX(s),
            EY0 - 0.26,
            0,
          ],
          true,
        )
      );
    });

    parts.push(
      line(
        [EX0, EY0, 0],
        [EX1, EY0, 0],
        C.muted,
        2.2,
      ),

      line(
        [EX0, EY0, 0],
        [EX0, EY1, 0],
        C.muted,
        2.2,
      ),

      textAt(
        'Hazard multiplier',
        18,
        C.ink,
        [
          CX,
          EY1 + 0.28,
          0,
        ],
      ),

      textAt(
        'Change in score',
        17,
        C.ink,
        [
          CX,
          EY0 - 0.63,
          0,
        ],
      ),
    );

    return new M.VGroup(...parts);
  }

  function exponentialCurve() {
    const parts = [];

    const n = 80;

    for (let i = 0; i < n; i++) {
      const a =
        SCORE_MIN +
        (SCORE_MAX - SCORE_MIN) * i / n;

      const b =
        SCORE_MIN +
        (SCORE_MAX - SCORE_MIN) * (i + 1) / n;

      parts.push(
        line(
          expPoint(a),
          expPoint(b),
          C.green,
          4,
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function exponentialMarker(
    s,
    label,
    color,
  ) {
    const p = expPoint(s);

    return new M.VGroup(
      dash(
        [
          p[0],
          EY0,
          0,
        ],
        p,
        C.violet,
      ),

      dash(
        [
          EX0,
          p[1],
          0,
        ],
        p,
        color,
      ),

      glow(
        p,
        color,
        0.10,
      ),

      textAt(
        label,
        18,
        color,
        [
          p[0] - 0.25,
          p[1] + 0.33,
          0,
        ],
        true,
      ),
    );
  }

  const expAxes = exponentialAxes();
  const expCurve = exponentialCurve();

  const neutralMark = exponentialMarker(
    0,
    '1×',
    NO_CALL_COLOR,
  );

  const callMark = exponentialMarker(
    BETA,
    '2×',
    CALL_COLOR,
  );

  const scoreStepY = EY0 + 0.31;

  const scoreStep = arrow(
    [
      scoreX(0) + 0.04,
      scoreStepY,
      0,
    ],
    [
      scoreX(BETA) - 0.04,
      scoreStepY,
      0,
    ],
    C.violet,
    3,
  );

  const scoreStepTag = tagAt(
    '+0.69',
    C.violet,
    [
      (
        scoreX(0) +
        scoreX(BETA)
      ) / 2,
      scoreStepY + 0.31,
      0,
    ],
    16,
  );

  // ------------------------------------------------------------
  // 22: suppose the fitted call coefficient is about 0.69.
  //
  // No call is the reference category.
  // A phone call adds this coefficient to the score.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...picture(
      expAxes,
      neutralMark,
      scoreStep,
      scoreStepTag,
    ),
    ...fbox([
      ['Suppose the fitted effect', C.amber],
      'No call: score change 0',
      ['Call: score change +0.69', C.violet],
    ], C.violet),
    ...say(
      'SUPPOSE THE CALL ADDS ABOUT 0.69',
      C.violet,
    ),
  );

  // ------------------------------------------------------------
  // 23: introduce the exponential translation.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...addPicture(
      expCurve,
      dash([scoreX(BETA), EY0, 0], expPoint(BETA), C.violet),
      glow(expPoint(BETA), C.violet, 0.09),
    ),
    ...fbox([
      ['Score increase', C.violet],
      '↓ exponential ↓',
      ['Hazard multiplier', C.green],
    ], C.green),
    ...say(
      'TURN THE SCORE INCREASE INTO A MULTIPLIER',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // 24: mathematical rule.
  //
  // Hazard ratio = exp(score increase).
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...fbox([
      ['Hazard ratio', C.green],
      '= e to the power',
      ['  of the score increase', C.violet],
      ['HR = e^β', C.green],
    ], C.green),
    ...say(
      'HAZARD RATIO = e TO THE SCORE INCREASE',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // 25: exp(0.69) is approximately 2.
  //
  // The exact demonstration coefficient ln(2) gives 2 exactly.
  // ------------------------------------------------------------

  await until(S(29));
  await play(
    ...addPicture(callMark),
    ...fbox([
      'HR = e^0.69',
      ['≈ 2', C.green],
    ], C.green),
    ...say(
      'THE HAZARD RATIO IS ABOUT 2',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // 26: interpretation.
  //
  // Among comparable patients still waiting at the same
  // moment, the call group's follow-up hazard is twice
  // the no-call group's hazard in this example.
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    ...picture(...momentPicture(true)),
    ...fbox([
      ['Hazard ratio ≈ 2', C.green],
      'Twice the follow-up rate',
      ['among those still waiting.', RED],
    ], C.green),
    ...say(
      'TWICE THE RATE AMONG THOSE STILL WAITING',
      C.green,
    ),
  );

  // ------------------------------------------------------------
  // Cumulative waiting picture.
  //
  // Unlike the 20-dot weekly rows, these grids keep the
  // ORIGINAL starting group as the denominator.
  //
  // Each grid contains 100 percentage units.
  // One dot = 1% of the original group.
  //
  // This is a percentage illustration, not a claim that
  // the clinic observed exactly 100 patients in each group.
  // ------------------------------------------------------------

  const GRID_N = 100;
  const GRID_COLS = 10;

  const GRID_SP = P ? 0.225 : 0.235;

  const GRID_CENTERS = [
    CX - (P ? 1.48 : 1.55),
    CX + (P ? 1.48 : 1.55),
  ];

  const GRID_TOP = P ? 0.42 : 0.30;

  const GRID_DOT = P ? 0.066 : 0.070;

  const GRID_W = GRID_COLS * GRID_SP;

  const GRID_LABEL_Y =
    GRID_TOP + 0.55;

  const GRID_BOTTOM =
    GRID_TOP - 9 * GRID_SP;

  function cumulativeGrid(
    group,
    waitingPercent,
    showCompleted = true,
    week = 0,
  ) {
    const x = GRID_CENTERS[group];

    const groupColor = group === 0
      ? NO_CALL_COLOR
      : CALL_COLOR;

    const groupName = group === 0
      ? 'NO CALL'
      : 'PHONE CALL';

    const parts = [];

    parts.push(
      textAt(
        groupName,
        20,
        groupColor,
        [
          x,
          GRID_LABEL_Y,
          0,
        ],
        false,
        GRID_W + 0.25,
      )
    );

    const waitingCount =
      Math.round(waitingPercent);

    const doneCount =
      GRID_N - waitingCount;

    const frame = rect(
      GRID_W + 0.20,
      GRID_W + 0.20,
      [
        x,
        (GRID_TOP + GRID_BOTTOM) / 2,
        0,
      ],
      groupColor,
      C.card,
      0.35,
    );

    parts.push(frame);

    for (let i = 0; i < GRID_N; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);

      const completed = i < doneCount;

      const color = completed
        ? (
          showCompleted
            ? TEAL
            : C.muted
        )
        : RED;

      const opacity =
        completed && !showCompleted
          ? 0.18
          : 1;

      parts.push(
        dot(
          [
            x +
              (col - (GRID_COLS - 1) / 2) *
              GRID_SP,
            GRID_TOP - row * GRID_SP,
            0,
          ],
          color,
          GRID_DOT,
          opacity,
        )
      );
    }

    parts.push(
      textAt(
        `${waitingCount}% waiting`,
        19,
        RED,
        [
          x,
          GRID_BOTTOM - 0.42,
          0,
        ],
        true,
        GRID_W + 0.28,
      )
    );

    if (showCompleted && week > 0) {
      parts.push(
        textAt(
          `${doneCount}% completed`,
          18,
          TEAL,
          [
            x,
            GRID_BOTTOM - 0.78,
            0,
          ],
          true,
          GRID_W + 0.28,
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function cumulativeHeading(label) {
    return tagAt(
      label,
      C.amber,
      [
        CX,
        P ? 1.45 : 1.30,
        0,
      ],
      16,
    );
  }

  function cumulativeKey() {
    const y = P ? -3.70 : -2.95;

    return new M.VGroup(
      dot(
        [CX - 2.47, y, 0],
        RED,
        0.07,
      ),

      textAt(
        'Waiting',
        15,
        RED,
        [
          CX - 1.77,
          y,
          0,
        ],
      ),

      dot(
        [CX + 0.16, y, 0],
        TEAL,
        0.07,
      ),

      textAt(
        'Completed',
        15,
        TEAL,
        [
          CX + 1.20,
          y,
          0,
        ],
      ),
    );
  }

  function cumulativeNote() {
    return textAt(
      'Each dot = 1% of the original group',
      15,
      C.muted,
      [
        CX,
        P ? -4.15 : -2.95,
        0,
      ],
      false,
      5.90,
    );
  }

  function cumulativePicture({
    noCallWaiting = 100,
    callWaiting = 100,
    showNoCallDone = true,
    showCallDone = true,
    noCallWeek = 0,
    callWeek = 0,
    title = 'ORIGINAL STARTING GROUPS',
  } = {}) {
    const parts = [
      cumulativeHeading(title),

      cumulativeGrid(
        0,
        noCallWaiting,
        showNoCallDone,
        noCallWeek,
      ),

      cumulativeGrid(
        1,
        callWaiting,
        showCallDone,
        callWeek,
      ),

      cumulativeKey(),
    ];

    // On laptop the bottom note would compete with
    // the fixed content boundary, so the explanatory
    // denominator is included in the formula panel.
    if (P) {
      parts.push(cumulativeNote());
    }

    return parts;
  }

  // ------------------------------------------------------------
  // 27: return to the weekly example to check the interpretation.
  //
  // Start with both original groups at 100%.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    ...picture(
      ...cumulativePicture(),
    ),
    ...fbox([
      ['CHECK THE WEEKLY EXAMPLE', C.amber],
      'Both groups start at 100%.',
      'Each dot = 1% of its',
      'original starting group.',
    ], C.amber),
    ...say(
      'LET’S CHECK WHAT HAPPENS OVER TWO WEEKS',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // 28: no-call group retains 90% each week.
  //
  // Show the first weekly step.
  // The second 90% applies to the 90% remaining.
  // ------------------------------------------------------------

  await until(S(32));
  await play(
    ...picture(
      ...cumulativePicture({
        noCallWaiting: 90,
        noCallWeek: 1,
        callWaiting: 100,
        title: 'NO CALL: FIRST WEEK',
      }),
    ),
    ...fbox([
      ['No call', NO_CALL_COLOR],
      '10% get a visit each week.',
      ['90% stay waiting', RED],
      'Keep 0.9 each week.',
    ], NO_CALL_COLOR),
    ...say(
      'NO CALL: KEEP 90% EACH WEEK',
      RED,
    ),
  );

  // ------------------------------------------------------------
  // 29: retain 90% twice.
  //
  // 100% × 0.9 × 0.9 = 81%.
  //
  // The nine additional removed units are 10% of the
  // ninety units that remained after week one.
  // ------------------------------------------------------------

  await until(S(33));
  await play(
    ...picture(
      ...cumulativePicture({
        noCallWaiting:
          Math.round(NO_CALL_STILL * 100),

        showNoCallDone: false,
        noCallWeek: 2,

        callWaiting: 100,

        title: 'NO CALL: TWO WEEKS',
      }),
    ),
    ...fbox([
      '100% × 0.9',
      '= 90%',
      '90% × 0.9',
      ['= 81% still waiting', RED],
    ], NO_CALL_COLOR),
    ...say(
      '90% OF 90% LEAVES 81% WAITING',
      RED,
    ),
  );

  // ------------------------------------------------------------
  // 30: 19% have received their follow-up by week 2.
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    ...picture(
      ...cumulativePicture({
        noCallWaiting: 81,
        noCallWeek: 2,
        showNoCallDone: true,

        callWaiting: 100,

        title: 'NO CALL: TWO WEEKS',
      }),
    ),
    ...fbox([
      '100% − 81%',
      ['= 19% completed', TEAL],
      'By the end of week 2',
    ], NO_CALL_COLOR),
    ...say(
      '19% HAVE ALREADY HAD THEIR VISIT',
      TEAL,
    ),
  );

  // ------------------------------------------------------------
  // 31: phone-call group retains 80% each week.
  //
  // Show the first week for the call group while leaving
  // the completed no-call calculation in place.
  // ------------------------------------------------------------

  await until(S(35));
  await play(
    ...picture(
      ...cumulativePicture({
        noCallWaiting: 90,
        noCallWeek: 1,

        callWaiting: 80,
        callWeek: 1,

        title: 'BOTH GROUPS: WEEK 1',
      }),
    ),
    ...fbox([
      ['Phone call', CALL_COLOR],
      '20% get a visit each week.',
      ['80% stay waiting', RED],
      'Keep 0.8 each week.',
    ], CALL_COLOR),
    ...say(
      'PHONE CALL: KEEP 80% EACH WEEK',
      RED,
    ),
  );

  // ------------------------------------------------------------
  // 32: retain 80% twice.
  //
  // 100% × 0.8 × 0.8 = 64%.
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    ...picture(
      ...cumulativePicture({
        noCallWaiting: 81,
        noCallWeek: 2,

        callWaiting:
          Math.round(CALL_STILL * 100),

        callWeek: 2,
        showCallDone: false,

        title: 'CALL: TWO WEEKS',
      }),
    ),
    ...fbox([
      '100% × 0.8',
      '= 80%',
      '80% × 0.8',
      ['= 64% still waiting', RED],
    ], CALL_COLOR),
    ...say(
      '80% OF 80% LEAVES 64% WAITING',
      RED,
    ),
  );

  // ------------------------------------------------------------
  // 33: 36% have received their follow-up by week 2.
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...picture(
      ...cumulativePicture({
        noCallWaiting: 81,
        noCallWeek: 2,

        callWaiting: 64,
        callWeek: 2,
        showCallDone: true,

        title: 'BOTH GROUPS AFTER TWO WEEKS',
      }),
    ),
    ...fbox([
      '100% − 64%',
      ['= 36% completed', TEAL],
      'By the end of week 2',
    ], CALL_COLOR),
    ...say(
      '36% HAVE ALREADY HAD THEIR VISIT',
      TEAL,
    ),
  );

  // ------------------------------------------------------------
  // Cumulative probability comparison.
  //
  // Both bars start at zero and use the same scale.
  // Bar lengths represent the share of the ORIGINAL
  // starting group with a visit completed by week 2.
  // ------------------------------------------------------------

  const QX0 = CX - 1.73;
  const QX1 = CX + 2.72;

  const QMAX = 0.40;

  const QROWS = P
    ? [0.12, -1.65]
    : [0.46, -1.04];

  const QAXIS_Y = P ? -3.06 : -2.16;

  const cumulativeX = p =>
    QX0 + p / QMAX *
    (QX1 - QX0);

  function completedBar(
    group,
    completedShare,
  ) {
    const y = QROWS[group];

    const label = group === 0
      ? 'No call'
      : 'Phone call';

    const groupColor = group === 0
      ? NO_CALL_COLOR
      : CALL_COLOR;

    const width =
      cumulativeX(completedShare) - QX0;

    const parts = [
      textAt(
        label,
        17,
        groupColor,
        [
          QX0 - 0.76,
          y,
          0,
        ],
        false,
        1.40,
      ),

      line(
        [QX0, y, 0],
        [QX1, y, 0],
        C.muted,
        1.0,
      ),

      block(
        width,
        0.43,
        [
          QX0 + width / 2,
          y,
          0,
        ],
        TEAL,
        0.78,
      ),

      textAt(
        pct(completedShare),
        22,
        TEAL,
        [
          QX0 + width / 2,
          y + 0.37,
          0,
        ],
        true,
      ),
    ];

    return new M.VGroup(...parts);
  }

  function completedAxes() {
    const parts = [
      line(
        [
          QX0,
          QAXIS_Y,
          0,
        ],
        [
          QX1,
          QAXIS_Y,
          0,
        ],
        C.muted,
        2,
      ),
    ];

    [
      0,
      0.10,
      0.20,
      0.30,
      0.40,
    ].forEach(p => {
      const x = cumulativeX(p);

      parts.push(
        line(
          [
            x,
            QAXIS_Y - 0.06,
            0,
          ],
          [
            x,
            QAXIS_Y + 0.06,
            0,
          ],
          C.muted,
          1.2,
        ),

        textAt(
          pct(p),
          15,
          C.muted,
          [
            x,
            QAXIS_Y - 0.25,
            0,
          ],
          true,
        ),
      );
    });

    parts.push(
      textAt(
        'Completed by the end of week 2',
        17,
        C.ink,
        [
          CX,
          P ? -3.80 : -2.73,
          0,
        ],
        false,
        5.90,
      )
    );

    return new M.VGroup(...parts);
  }

  const doneNoCall = completedBar(
    0,
    NO_CALL_DONE,
  );

  const doneCall = completedBar(
    1,
    CALL_DONE,
  );

  const cumulativeRatioTag = tagAt(
    `≈ ${CUMULATIVE_RATIO.toFixed(1)}×`,
    C.amber,
    [
      CX + 0.65,
      P ? -2.35 : -1.75,
      0,
    ],
    20,
  );

  const cumulativeTitle = textAt(
    'Share of the original group',
    20,
    C.ink,
    [
      CX,
      P ? 1.28 : 1.44,
      0,
    ],
  );

  // ------------------------------------------------------------
  // 34: 36 divided by 19 is approximately 1.9.
  //
  // This is a cumulative probability ratio.
  // It is not the hazard ratio.
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    ...picture(
      completedAxes(),
      doneNoCall,
      doneCall,
      cumulativeTitle,
      cumulativeRatioTag,
    ),
    ...fbox([
      ['Phone call: 36%', TEAL],
      ['No call:    19%', TEAL],
      '36 ÷ 19',
      ['≈ 1.9', C.amber],
    ], C.amber),
    ...say(
      '36 DIVIDED BY 19 IS ABOUT 1.9',
      C.amber,
    ),
  );

  // ------------------------------------------------------------
  // Final distinction: two different denominators.
  //
  // Hazard ratio:
  //   Compare current follow-up rates among those still waiting.
  //
  // Cumulative probability ratio:
  //   Compare shares of the original groups completed by a date.
  //
  // The weekly illustration gives 2 and approximately 1.9.
  // ------------------------------------------------------------

  function distinctionCard(
    y,
    title,
    value,
    description,
    color,
  ) {
    const w = P ? 5.95 : 6.10;
    const h = P ? 1.60 : 1.35;

    const parts = [
      rect(
        w,
        h,
        [
          CX,
          y,
          0,
        ],
        color,
      ),

      textAt(
        title,
        18,
        color,
        [
          CX - 0.73,
          y + 0.34,
          0,
        ],
        false,
        w - 1.85,
      ),

      textAt(
        value,
        31,
        color,
        [
          CX + w / 2 - 0.76,
          y + 0.03,
          0,
        ],
        true,
      ),

      textAt(
        description,
        16,
        C.ink,
        [
          CX - 0.66,
          y - 0.25,
          0,
        ],
        false,
        w - 1.95,
      ),
    ];

    return new M.VGroup(...parts);
  }

  const hazardDistinction = distinctionCard(
    P ? 0.15 : 0.50,
    'HAZARD RATIO',
    '2×',
    'Rate among those still waiting',
    C.green,
  );

  const probabilityDistinction = distinctionCard(
    P ? -1.80 : -1.10,
    'COMPLETED BY WEEK 2',
    '1.9×',
    'Share of original starting group',
    C.amber,
  );

  const notSame = textAt(
    'Different questions. Different multipliers.',
    18,
    PINK,
    [
      CX,
      P ? -3.16 : -2.28,
      0,
    ],
    false,
    5.90,
  );

  // ------------------------------------------------------------
  // 35: the interpretation trap.
  //
  // A hazard ratio of two does not mean twice as many
  // of the original group will have completed follow-up
  // by every chosen date.
  // ------------------------------------------------------------

  await until(S(39));
  await play(
    ...picture(
      ...hazardPicture([0.14, 0.49, 0.84]),
    ),
    ...fbox([
      ['ASSUMPTION', C.amber],
      'The multiplier stays',
      ['the same over time.', C.green],
      'If it changes a lot,',
      ['one number hides it.', PINK],
    ], C.amber),
    ...say(
      'ASSUME THE MULTIPLIER STAYS THE SAME',
      C.amber,
    ),
  );

  await until(S(41));
  await play(
    ...picture(
      hazardDistinction,
      probabilityDistinction,
      notSame,
    ),
    ...fbox([
      ['THE TRAP', PINK],
      'Hazard ratio ≈ 2',
      'Does not mean twice',
      'the completed share',
      'at every date.',
    ], PINK),
    ...say(
      'A HAZARD RATIO IS NOT A CUMULATIVE CHANCE RATIO',
      PINK,
    ),
  );

  // ------------------------------------------------------------
  // 36: final recap.
  //
  // Return to the two proportional instantaneous hazard
  // curves and show the constant multiplier at several
  // moments.
  //
  // One hazard ratio is appropriate when the proportional
  // hazards assumption is reasonable.
  // ------------------------------------------------------------

  await until(S(42));
  await play(
    ...picture(
      ...hazardPicture([
        0.14,
        0.49,
        0.84,
      ]),
    ),
    ...fbox([
      ['COX REGRESSION', C.green],
      ['HR = e^score increase', C.violet],
      'Compares follow-up rates',
      'among those still waiting.',
      ['Assumes a constant ratio.', C.amber],
    ], C.green),
    ...say(
      'COX: COMPARE THE SPEED AMONG THOSE STILL WAITING',
      C.green,
    ),
  );
}
