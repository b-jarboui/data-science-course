// lesson 12.4.10
// Log loss — live, narration-synchronised lesson.
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

    // q is the probability assigned to the recorded outcome.
    const q = d.failed ? p : (100 - d.prob) / 100;

    const loss = -Math.log(q);

    return {
      ...d,
      p,
      y,
      q,
      loss
    };
  });

  const IDS = DATA.map((_, i) => i);

  const TOTAL = DATA.reduce(
    (sum, d) => sum + d.loss,
    0
  );

  const MEAN = TOTAL / DATA.length;

  const fmt = (v, digits = 3) =>
    Number(v).toFixed(digits);

  const pct = v =>
    `${Math.round(v * 100)}%`;

  const penalty = q =>
    q === 0 ? Infinity : -Math.log(q);

  // Checked values:
  //
  // Pump   Actual-outcome probability   Log loss
  // P1              0.1                  2.303
  // P2              0.6                  0.511
  // P3              0.4                  0.916
  // P4              0.3                  1.204
  // P5              0.7                  0.357
  // P6              0.7                  0.357
  // P7–P12          0.9                  0.105 each
  //
  // Sum of unrounded penalties ≈ 6.279.
  // Mean log loss ≈ 0.523.
  //
  // Never sum the rounded display values.
  //
  // No alert threshold is needed for this measure.

  // ------------------------------------------------------------
  // Fixed chapter colours.
  // ------------------------------------------------------------

  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green || '#4ADE80';
  const AMBER = C.amber || '#FBBF24';
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
  // Basic drawing helpers.
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

  function dashed(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 1.5
  ) {
    return new M.DashedLine({
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

  function arrow(
    x1, y1, x2, y2,
    color,
    head = 0.14,
    sw = 2.4
  ) {
    const a = Math.atan2(
      y2 - y1,
      x2 - x1
    );

    return new M.VGroup(
      line(
        x1, y1, x2, y2,
        color, sw
      ),

      line(
        x2,
        y2,
        x2 + head * Math.cos(a + Math.PI * 0.82),
        y2 + head * Math.sin(a + Math.PI * 0.82),
        color,
        sw
      ),

      line(
        x2,
        y2,
        x2 + head * Math.cos(a - Math.PI * 0.82),
        y2 + head * Math.sin(a - Math.PI * 0.82),
        color,
        sw
      )
    );
  }

  const fadeIn = objects =>
    objects.filter(Boolean).map(o =>
      new M.FadeIn(o)
    );

  const fadeOut = objects =>
    objects.filter(Boolean).map(o =>
      new M.FadeOut(o)
    );

  const indicate = (
    objects,
    color = AMBER,
    runTime = 0.8
  ) =>
    objects.filter(Boolean).map(o =>
      new M.Indicate(o, {
        color,
        runTime
      })
    );

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

  // ------------------------------------------------------------
  // Named scene slots.
  //
  // Already-visible objects remain independent scene objects.
  // They are never wrapped in a new VGroup.
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
    const lh = P ? 0.34 : 0.42;

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
    const ht = rows.length * lh + 0.40;

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
      BOXP[1] + ht / 2 - 0.20 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.34 : 2.55;

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

    const feet = [-0.29, 0.19].map(dx =>
      rect(
        x + dx * s,
        y - 0.26 * s,
        0.22 * s,
        0.10 * s,
        color,
        0.35,
        1
      )
    );

    return new M.VGroup(
      motor,
      ...fins,
      housing,
      inlet,
      outlet,
      hub,
      ...feet
    );
  }

  function bellIcon(x, y, s = 1) {
    const r = 0.095 * s;

    const dome = new M.Circle({ radius: r, color: AMBER, strokeWidth: 2 });
    dome.setFill(AMBER, 0);

    dome.moveTo([
      x,
      y + 0.035 * s,
      0
    ]);

    return new M.VGroup(
      dome,

      line(
        x - r,
        y + 0.02 * s,
        x - 0.12 * s,
        y - 0.085 * s,
        AMBER,
        2
      ),

      line(
        x + r,
        y + 0.02 * s,
        x + 0.12 * s,
        y - 0.085 * s,
        AMBER,
        2
      ),

      line(
        x - 0.135 * s,
        y - 0.085 * s,
        x + 0.135 * s,
        y - 0.085 * s,
        AMBER,
        2.5
      ),

      circle(
        x,
        y + 0.14 * s,
        0.024 * s,
        AMBER,
        1,
        1
      ),

      circle(
        x,
        y - 0.135 * s,
        0.030 * s,
        AMBER,
        1,
        1
      )
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

  function clockIcon(
    x,
    y,
    s = 1,
    color = AMBER
  ) {
    return new M.VGroup(
      circle(
        x,
        y,
        0.32 * s,
        color,
        0,
        2.5
      ),

      line(
        x, y,
        x, y + 0.20 * s,
        color, 2.5
      ),

      line(
        x, y,
        x + 0.16 * s,
        y - 0.08 * s,
        color, 2.5
      ),

      circle(
        x,
        y,
        0.025 * s,
        color,
        1,
        1
      )
    );
  }

  // ------------------------------------------------------------
  // Shared pump card design.
  // ------------------------------------------------------------

  const CARD_W = 1.24;
  const CARD_H = 1.10;

  function cardBase(
    id,
    x,
    y,
    s = 1
  ) {
    return new M.VGroup(
      rounded(
        x,
        y,
        CARD_W * s,
        CARD_H * s,
        C.muted,
        C.card,
        0.96,
        1.6,
        0.10 * s
      ),

      text(
        id,
        Math.max(12, Math.round(19 * s)),
        C.ink,
        x - 0.16 * s,
        y + 0.32 * s,
        true,
        0.66 * s
      ),

      pumpIcon(
        x - 0.18 * s,
        y - 0.015 * s,
        0.46 * s,
        C.cyan
      ),

      line(
        x - 0.48 * s,
        y - 0.22 * s,
        x + 0.48 * s,
        y - 0.22 * s,
        C.muted,
        1
      )
    );
  }

  function chanceLabel(
    i,
    x,
    y,
    s = 1
  ) {
    return text(
      `${DATA[i].prob}%`,
      Math.max(12, Math.round(19 * s)),
      BLUE,
      x,
      y - 0.36 * s,
      true,
      0.82 * s
    );
  }

  function outcomeMark(
    i,
    x,
    y,
    s = 1
  ) {
    const xx = x + 0.37 * s;
    const yy = y - 0.055 * s;

    return DATA[i].failed
      ? failureIcon(xx, yy, s)
      : safeIcon(xx, yy, s);
  }

  function completeCard(
    i,
    x,
    y,
    s = 1
  ) {
    return new M.VGroup(
      cardBase(
        DATA[i].id,
        x,
        y,
        s
      ),

      chanceLabel(
        i,
        x,
        y,
        s
      ),

      outcomeMark(
        i,
        x,
        y,
        s
      )
    );
  }

  // ------------------------------------------------------------
  // 0–2: Introduce the cost of confident wrong predictions.
  //
  // This opening picture is illustrative. It does not add
  // another observation to the fixed twelve-pump dataset.
  // ------------------------------------------------------------

  const INTRO_Y = P ? -0.30 : -0.25;

  const introPump = pumpIcon(
    CX - 1.65,
    INTRO_Y,
    1.85,
    C.cyan
  );

  const introBell = bellIcon(
    CX - 1.65,
    INTRO_Y + 1.22,
    1.90
  );

  const introWarning = text(
    'ALMOST CERTAIN TO FAIL',
    18,
    AMBER,
    CX - 1.65,
    INTRO_Y - 1.10,
    true,
    3.0
  );

  const replacementPump = pumpIcon(
    CX + 1.65,
    INTRO_Y,
    1.50,
    AMBER
  );

  const replacementFrame = rounded(
    CX + 1.65,
    INTRO_Y,
    2.25,
    1.65,
    AMBER,
    C.card,
    0,
    2,
    0.14
  );

  const replacementLabel = text(
    'REPLACEMENT READY',
    16,
    AMBER,
    CX + 1.65,
    INTRO_Y - 1.10,
    true,
    2.95
  );

  const workClock = clockIcon(
    CX,
    P ? -2.48 : -2.15,
    1.10
  );

  const workTime = text(
    'Valuable preparation time',
    18,
    AMBER,
    CX,
    P ? -3.02 : -2.65,
    false,
    6.3
  );

  const stillWorking = safeIcon(
    CX - 1.65,
    INTRO_Y + 1.10,
    2.0
  );

  await until(S(0));
  await play(
    new M.FadeIn(introPump),
    new M.FadeIn(introBell),
    new M.FadeIn(introWarning),
    ...say('ALMOST CERTAIN TO FAIL', AMBER)
  );

  await until(S(1));
  await play(
    new M.FadeOut(introBell),
    new M.FadeIn(stillWorking),
    new M.FadeIn(replacementPump),
    new M.Create(replacementFrame),
    new M.FadeIn(replacementLabel),
    new M.FadeIn(workClock),
    new M.FadeIn(workTime),
    ...say('BUT THE ORIGINAL PUMP KEEPS WORKING', GREEN)
  );

  await until(S(2));
  await play(
    new M.Indicate(
      introWarning,
      { color: AMBER }
    ),
    ...fbox([
      ['a confident wrong prediction', AMBER],
      'should it receive',
      ['a much larger penalty?', VIOLET]
    ], VIOLET),
    ...say('SHOULD CONFIDENT MISTAKES COST MORE?', VIOLET)
  );

  // ------------------------------------------------------------
  // 3–7: Bring back P1, P2 and P3.
  // ------------------------------------------------------------

  const THREE_IDS = [0, 1, 2];

  const THREE_Y = P ? -0.35 : -0.32;
  const THREE_SCALE = P ? 1.42 : 1.35;
  const THREE_SP = 2.06;

  const threePositions = THREE_IDS.map((_, j) => [
    CX + (j - 1) * THREE_SP,
    THREE_Y,
    0
  ]);

  const threeCards = THREE_IDS.map((i, j) =>
    cardBase(
      DATA[i].id,
      threePositions[j][0],
      threePositions[j][1],
      THREE_SCALE
    )
  );

  const threeChances = THREE_IDS.map((i, j) =>
    chanceLabel(
      i,
      threePositions[j][0],
      threePositions[j][1],
      THREE_SCALE
    )
  );

  const threeOutcomes = THREE_IDS.map((i, j) =>
    outcomeMark(
      i,
      threePositions[j][0],
      threePositions[j][1],
      THREE_SCALE
    )
  );

  const threeLabels = THREE_IDS.map((i, j) =>
    text(
      DATA[i].failed
        ? 'FAILED'
        : 'NO FAILURE',
      17,
      DATA[i].failed ? RED : GREEN,
      threePositions[j][0],
      THREE_Y - 1.10,
      true,
      1.95
    )
  );

  await until(S(3));
  await play(
    ...fadeOut([
      introPump,
      introWarning,
      stillWorking,
      replacementPump,
      replacementFrame,
      replacementLabel,
      workClock,
      workTime
    ]),
    ...clearBox(),
    lag(
      fadeIn(threeCards),
      1.0,
      0.20
    ),
    ...say('THREE OF OUR TWELVE WATER PUMPS')
  );

  await until(S(4));
  await play(
    new M.FadeIn(threeChances[0]),
    ...say('P1: 90% CHANCE OF FAILURE', BLUE)
  );

  await until(S(5));
  await play(
    new M.FadeIn(threeChances[1]),
    new M.FadeIn(threeChances[2]),
    ...say('P2 AND P3: 60% EACH', BLUE)
  );

  await until(S(6));
  await play(
    ...fadeIn(threeLabels),
    ...fbox([
      ['10 hours later', WHITE],
      ['P2 failed', RED],
      ['P1 and P3 did not fail', GREEN]
    ]),
    ...say('ONLY P2 FAILS WITHIN TEN HOURS')
  );

  await until(S(7));
  await play(
    ...fadeIn(threeOutcomes),
    ...fbox([
      ['diamond = actual failure', RED],
      ['circle = no actual failure', GREEN]
    ]),
    ...say('MARK WHAT ACTUALLY HAPPENED')
  );

  // ------------------------------------------------------------
  // 8: Each prediction describes two possible outcomes.
  // ------------------------------------------------------------

  const outcomeHeading = text(
    'TWO POSSIBLE OUTCOMES',
    22,
    WHITE,
    CX,
    P ? 1.30 : 1.22,
    true,
    6.5
  );

  const possibleFailure = new M.VGroup(
    failureIcon(
      CX - 1.65,
      P ? -0.18 : -0.10,
      3.0
    ),

    text(
      'Failure',
      22,
      RED,
      CX - 1.65,
      P ? -0.95 : -0.87
    ),

    text(
      'within 10 hours',
      16,
      WHITE,
      CX - 1.65,
      P ? -1.35 : -1.27
    )
  );

  const possibleSafe = new M.VGroup(
    safeIcon(
      CX + 1.65,
      P ? -0.18 : -0.10,
      3.0
    ),

    text(
      'No failure',
      22,
      GREEN,
      CX + 1.65,
      P ? -0.95 : -0.87
    ),

    text(
      'within 10 hours',
      16,
      WHITE,
      CX + 1.65,
      P ? -1.35 : -1.27
    )
  );

  await until(S(8));
  await play(
    ...fadeOut([
      ...threeCards,
      ...threeChances,
      ...threeOutcomes,
      ...threeLabels
    ]),
    new M.FadeIn(outcomeHeading),
    new M.FadeIn(possibleFailure),
    new M.FadeIn(possibleSafe),
    ...fbox([
      ['failure chance', BLUE],
      '+ chance of no failure',
      ['= 100%', WHITE]
    ], BLUE),
    ...say('FAILURE OR NO FAILURE WITHIN TEN HOURS')
  );

  // ------------------------------------------------------------
  // Probability bars.
  //
  // Each bar contains exactly 100 small blocks, arranged as
  // 50 columns by 2 rows for phone readability.
  //
  // Each block represents one percentage point of probability,
  // not one additional pump or one recorded observation.
  //
  // Blocks are filled column by column.
  // The first p*100 blocks represent failure.
  // The remaining blocks represent no failure.
  //
  // Amber outlines identify the portion assigned to what
  // actually happened. The outcome symbols retain their fixed
  // chapter meanings.
  // ------------------------------------------------------------

  const BAR_LEFT = CX - 1.65;
  const BAR_W = 4.74;
  const BAR_COLS = 50;
  const BAR_ROWS = 2;

  const BLOCK_PITCH = BAR_W / BAR_COLS;
  const BLOCK_W = BLOCK_PITCH * 0.84;
  const BLOCK_H = 0.145;

  const BAR_Y = P
    ? [0.98, -0.58, -2.14]
    : [0.99, -0.29, -1.57];

  const ROW_CARD_X = CX - 2.54;
  const ROW_CARD_SCALE = 0.82;

  function probabilityBlocks(
    i,
    y,
    state = 'split'
  ) {
    const d = DATA[i];

    const blocks = Array.from(
      { length: 100 },
      (_, k) => {
        const col = Math.floor(k / BAR_ROWS);
        const row = k % BAR_ROWS;

        const x =
          BAR_LEFT +
          (col + 0.5) * BLOCK_PITCH;

        const yy =
          y + (0.5 - row) * 0.18;

        const representsFailure =
          k < d.prob;

        let color = BLUE;
        let opacity = 0.16;

        if (state !== 'neutral') {
          color = representsFailure
            ? RED
            : GREEN;

          opacity = 0.48;
        }

        if (state === 'highlight') {
          const selected =
            representsFailure === d.failed;

          opacity = selected
            ? 0.92
            : 0.09;
        }

        return rect(
          x,
          yy,
          BLOCK_W,
          BLOCK_H,
          color,
          opacity,
          0.7
        );
      }
    );

    return new M.VGroup(
      ...blocks
    );
  }

  function probabilityLabels(i, y) {
    const d = DATA[i];

    const split =
      BAR_LEFT + BAR_W * d.p;

    const failCenter =
      (BAR_LEFT + split) / 2;

    const safeCenter =
      (split + BAR_LEFT + BAR_W) / 2;

    const failText = text(
      `Failure ${d.prob}%`,
      P ? 16 : 14,
      RED,
      failCenter,
      y + 0.37,
      false,
      Math.max(0.55, BAR_W * d.p - 0.07)
    );

    const safeText = text(
      `No failure ${100 - d.prob}%`,
      P ? 16 : 14,
      GREEN,
      safeCenter,
      y + 0.37,
      false,
      Math.max(0.42, BAR_W * (1 - d.p) - 0.05)
    );

    const splitLine = line(
      split,
      y - 0.21,
      split,
      y + 0.22,
      WHITE,
      1.5
    );

    return [
      failText,
      safeText,
      splitLine
    ];
  }

  function outcomeProbabilityOutline(i, y) {
    const d = DATA[i];

    const split =
      BAR_LEFT + BAR_W * d.p;

    const left = d.failed
      ? BAR_LEFT
      : split;

    const right = d.failed
      ? split
      : BAR_LEFT + BAR_W;

    return rounded(
      (left + right) / 2,
      y,
      right - left + 0.05,
      0.39,
      AMBER,
      AMBER,
      0,
      2.6,
      0.04
    );
  }

  function actualChanceLabel(i, y) {
    const d = DATA[i];

    return text(
      `Chance of actual outcome = ${pct(d.q)}`,
      15,
      AMBER,
      BAR_LEFT + BAR_W / 2,
      y - 0.40,
      true,
      BAR_W + 0.15
    );
  }

  const probabilityRows = [];

  function makeProbabilityRow(
    i,
    rowIndex,
    state = 'split'
  ) {
    const y = BAR_Y[rowIndex];

    const card = completeCard(
      i,
      ROW_CARD_X,
      y,
      ROW_CARD_SCALE
    );

    const blocks = probabilityBlocks(
      i,
      y,
      state
    );

    const labels =
      state === 'neutral'
        ? []
        : probabilityLabels(i, y);

    return {
      i,
      y,
      card,
      blocks,
      labels,
      highlight: null,
      actualChance: null,
      extra: null
    };
  }

  function showProbabilityRow(
    i,
    rowIndex,
    state = 'split'
  ) {
    const row = makeProbabilityRow(
      i,
      rowIndex,
      state
    );

    probabilityRows[rowIndex] = row;

    return [
      new M.FadeIn(row.card),
      new M.FadeIn(row.blocks),
      ...fadeIn(row.labels)
    ];
  }

  function splitProbabilityRow(k) {
    const row = probabilityRows[k];

    row.labels = probabilityLabels(
      row.i,
      row.y
    );

    return [
      new M.Transform(
        row.blocks,
        probabilityBlocks(
          row.i,
          row.y,
          'split'
        )
      ),
      ...fadeIn(row.labels)
    ];
  }

  function highlightActualOutcome(k) {
    const row = probabilityRows[k];

    row.highlight = outcomeProbabilityOutline(
      row.i,
      row.y
    );

    row.actualChance = actualChanceLabel(
      row.i,
      row.y
    );

    return [
      new M.Transform(
        row.blocks,
        probabilityBlocks(
          row.i,
          row.y,
          'highlight'
        )
      ),

      new M.Create(row.highlight),

      new M.FadeIn(row.actualChance)
    ];
  }

  function hideProbabilityRows() {
    const objects = probabilityRows.flatMap(row => [
      row.card,
      row.blocks,
      ...row.labels,
      row.highlight,
      row.actualChance,
      row.extra
    ]);

    probabilityRows.length = 0;

    return fadeOut(objects);
  }

  // ------------------------------------------------------------
  // 9: Introduce the 100-block probability bar.
  // ------------------------------------------------------------

  await until(S(9));
  await play(
    ...fadeOut([
      outcomeHeading,
      possibleFailure,
      possibleSafe
    ]),
    ...showProbabilityRow(
      1,
      0,
      'neutral'
    ),
    ...replace('block-key', [
      text(
        '100 blocks: each represents 1 percentage point',
        15,
        BLUE,
        CX,
        P ? -4.10 : -2.62,
        false,
        6.55
      )
    ]),
    ...fbox([
      ['100 small blocks', BLUE],
      'one block = one percentage point'
    ], BLUE),
    ...say('REPRESENT EACH CHANCE WITH 100 BLOCKS', BLUE)
  );

  // ------------------------------------------------------------
  // 10: P2 — 60 blocks for failure, 40 for no failure.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...splitProbabilityRow(0),
    ...fbox([
      ['P2: failure chance = 60%', RED],
      ['no failure = 40%', GREEN],
      '60 + 40 = 100 blocks'
    ], BLUE),
    ...say('P2: SIXTY FAILURE BLOCKS · FORTY NO-FAILURE BLOCKS')
  );

  // ------------------------------------------------------------
  // 11: P2 failed, so its relevant probability is 0.6.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...highlightActualOutcome(0),
    ...fbox([
      ['P2 actually failed', RED],
      ['chance of what happened = 60%', AMBER]
    ], AMBER),
    ...say('HIGHLIGHT THE SIXTY BLOCKS FOR WHAT HAPPENED', AMBER)
  );

  // ------------------------------------------------------------
  // 12: P3 has the same forecast but a different outcome.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    ...showProbabilityRow(
      2,
      1,
      'split'
    ),
    ...fbox([
      ['P3: failure chance = 60%', BLUE],
      ['but no failure occurred', GREEN]
    ]),
    ...say('P3: SAME PREDICTION, DIFFERENT OUTCOME')
  );

  // ------------------------------------------------------------
  // 13: P3 survived, so highlight the complementary 40%.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    ...highlightActualOutcome(1),
    ...fbox([
      ['P3 did not fail', GREEN],
      '100% − 60% = 40%',
      ['chance of what happened = 40%', AMBER]
    ], AMBER),
    ...say('HIGHLIGHT THE FORTY NO-FAILURE BLOCKS', AMBER)
  );

  // ------------------------------------------------------------
  // 14: P1 has a 90% predicted failure chance.
  // ------------------------------------------------------------

  await until(S(14));
  await play(
    ...showProbabilityRow(
      0,
      2,
      'split'
    ),
    ...fbox([
      ['P1: predicted failure chance', BLUE],
      ['90%', BLUE]
    ], BLUE),
    ...say('P1: A MUCH MORE CONFIDENT 90% PREDICTION', BLUE)
  );

  // ------------------------------------------------------------
  // 15: Only ten blocks represent no failure.
  // ------------------------------------------------------------

  await until(S(15));

  probabilityRows[2].extra = rounded(
    BAR_LEFT + BAR_W * 0.95,
    BAR_Y[2],
    BAR_W * 0.10 + 0.05,
    0.39,
    GREEN,
    GREEN,
    0,
    2.3,
    0.04
  );

  await play(
    new M.Create(probabilityRows[2].extra),
    ...fbox([
      '100% − 90%',
      ['= 10% chance of no failure', GREEN]
    ], GREEN),
    ...say('ONLY TEN BLOCKS REPRESENT NO FAILURE', GREEN)
  );

  // ------------------------------------------------------------
  // 16: P1 survived — the actual-outcome probability is 10%.
  // ------------------------------------------------------------

  await until(S(16));

  const oldP1Outline =
    probabilityRows[2].extra;

  probabilityRows[2].extra = null;

  await play(
    new M.FadeOut(oldP1Outline),
    ...highlightActualOutcome(2),
    ...fbox([
      ['P1 did not fail', GREEN],
      ['chance of what happened = 10%', AMBER]
    ], AMBER),
    ...say('HIGHLIGHT THE TEN BLOCKS FOR WHAT ACTUALLY HAPPENED', AMBER)
  );

  // ------------------------------------------------------------
  // 17: Compare the assigned probabilities of actual outcomes.
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...indicate([
      probabilityRows[0].actualChance,
      probabilityRows[1].actualChance,
      probabilityRows[2].actualChance
    ], AMBER),
    ...fbox([
      ['P2: 60%', AMBER],
      ['P3: 40%', AMBER],
      ['P1: only 10%', AMBER]
    ], AMBER),
    ...say('P1 GAVE VERY LITTLE CHANCE TO WHAT HAPPENED', AMBER)
  );

  // ------------------------------------------------------------
  // 18: Introduce the desired behaviour of the penalty.
  // ------------------------------------------------------------

  await until(S(18));
  await play(
    new M.Indicate(
      probabilityRows[2].highlight,
      { color: VIOLET }
    ),
    ...fbox([
      ['smaller chance of actual outcome', AMBER],
      'should mean',
      ['a sharply increasing penalty', VIOLET]
    ], VIOLET),
    ...say('SMALLER CHANCE → MUCH LARGER PENALTY', VIOLET)
  );

  // ------------------------------------------------------------
  // Penalty graph.
  //
  // Horizontal axis:
  //   q = probability assigned to the actual outcome.
  //
  // Vertical axis:
  //   penalty = -ln(q).
  //
  // The formula is deliberately withheld until after the
  // learner has explored the curve geometrically.
  //
  // The graph displays finite positive q values only.
  // At q = 0, there is no finite penalty to plot.
  // ------------------------------------------------------------

  const GX0 = P ? -2.68 : -5.70;
  const GX1 = P ? 2.70 : 0.44;

  const GY0 = P ? -4.45 : -2.19;
  const GY1 = P ? 1.16 : 1.11;

  const GMAX = 5.4;

  const GW = GX1 - GX0;
  const GH = GY1 - GY0;
  const GCX = (GX0 + GX1) / 2;

  const gx = q =>
    GX0 + q * GW;

  const gy = value =>
    GY0 + value / GMAX * GH;

  const graphPoint = q => [
    gx(q),
    gy(penalty(q)),
    0
  ];

  function graphFrame() {
    return rounded(
      GCX,
      (GY0 + GY1) / 2,
      GW + 0.10,
      GH + 0.10,
      C.muted,
      C.card,
      0.23,
      1,
      0.05
    );
  }

  function graphXAxis() {
    return new M.VGroup(
      arrow(
        GX0,
        GY0,
        GX1 + 0.10,
        GY0,
        BLUE,
        0.12
      ),

      ...[0, 0.25, 0.5, 0.75, 1].flatMap(q => [
        line(
          gx(q),
          GY0 - 0.055,
          gx(q),
          GY0 + 0.055,
          C.muted,
          1.4
        ),

        text(
          pct(q),
          P ? 15 : 13,
          WHITE,
          gx(q),
          GY0 - 0.23,
          true,
          0.68
        )
      ]),

      text(
        'Chance assigned to what happened',
        16,
        BLUE,
        GCX,
        GY0 - 0.54,
        false,
        GW + 0.20
      )
    );
  }

  function graphYAxis() {
    return new M.VGroup(
      arrow(
        GX0,
        GY0,
        GX0,
        GY1 + 0.10,
        VIOLET,
        0.12
      ),

      ...[0, 1, 2, 3, 4, 5].flatMap(v => [
        line(
          GX0 - 0.055,
          gy(v),
          GX0 + 0.055,
          gy(v),
          C.muted,
          1.4
        ),

        text(
          String(v),
          P ? 15 : 14,
          WHITE,
          GX0 - 0.25,
          gy(v),
          true
        )
      ]),

      text(
        'Penalty',
        18,
        VIOLET,
        GCX,
        GY1 + 0.28,
        false
      )
    );
  }

  function graphGrid() {
    return new M.VGroup(
      ...[1, 2, 3, 4, 5].map(v =>
        line(
          GX0,
          gy(v),
          GX1,
          gy(v),
          C.muted,
          0.6
        )
      ),

      ...[0.25, 0.5, 0.75, 1].map(q =>
        line(
          gx(q),
          GY0,
          gx(q),
          GY1,
          C.muted,
          0.6
        )
      )
    );
  }

  let graphObjects = [];
  let curveSegments = [];
  let measuredMarkers = [];
  let activeGuides = [];

  let graphIsVisible = false;

  function showGraphFrame() {
    const frame = graphFrame();

    graphObjects.push(frame);
    graphIsVisible = true;

    return [
      new M.FadeIn(frame)
    ];
  }

  function showGraphX() {
    const axis = graphXAxis();

    graphObjects.push(axis);

    return [
      new M.FadeIn(axis)
    ];
  }

  function showGraphY() {
    const axis = graphYAxis();
    const grid = graphGrid();

    graphObjects.push(
      grid,
      axis
    );

    return [
      new M.FadeIn(grid),
      new M.FadeIn(axis)
    ];
  }

  function clearGuides() {
    const old = activeGuides;
    activeGuides = [];

    return fadeOut(old);
  }

  function clearMeasuredMarkers() {
    const old = measuredMarkers;
    measuredMarkers = [];

    return fadeOut(old);
  }

  function hideGraph() {
    const anims = [
      ...clearGuides(),
      ...clearMeasuredMarkers(),
      ...fadeOut(graphObjects),
      ...fadeOut(curveSegments)
    ];

    graphObjects = [];
    curveSegments = [];
    graphIsVisible = false;

    return anims;
  }

  // ------------------------------------------------------------
  // Build an exact sampled curve using -Math.log(q).
  //
  // Samples are spaced geometrically. This provides extra
  // detail near zero without drawing an invalid endpoint.
  //
  // No polynomial approximation or invented penalty values.
  // ------------------------------------------------------------

  function curvePart(
    qStart,
    qEnd,
    samples = 24
  ) {
    const result = [];

    for (let j = 0; j < samples; j++) {
      const t1 = j / samples;
      const t2 = (j + 1) / samples;

      const q1 =
        qStart * (qEnd / qStart) ** t1;

      const q2 =
        qStart * (qEnd / qStart) ** t2;

      result.push(
        new M.Line({
          start: graphPoint(q1),
          end: graphPoint(q2),
          color: VIOLET,
          strokeWidth: 3.6
        })
      );
    }

    return result;
  }

  function extendCurve(
    qStart,
    qEnd,
    samples = 24,
    runTime = 1.5
  ) {
    const part = curvePart(
      qStart,
      qEnd,
      samples
    );

    curveSegments.push(...part);

    return [
      lag(
        part.map(o =>
          new M.Create(o)
        ),
        runTime,
        0.045
      )
    ];
  }

  function makePenaltyDot(
    q,
    label,
    dx = 0.40,
    dy = 0.24,
    color = VIOLET
  ) {
    const p = graphPoint(q);

    const halo = new M.Dot({
      point: p,
      radius: 0.15,
      color
    });

    halo.setFill(color, 0.19);

    const dot = new M.Dot({
      point: p,
      radius: 0.069,
      color
    });

    const value = text(
      label,
      P ? 15 : 14,
      WHITE,
      p[0] + dx,
      p[1] + dy,
      true,
      1.45
    );

    return new M.VGroup(
      halo,
      dot,
      value
    );
  }

  function plotPenalty(
    q,
    label,
    dx = 0.40,
    dy = 0.24,
    color = VIOLET
  ) {
    const dot = makePenaltyDot(
      q,
      label,
      dx,
      dy,
      color
    );

    measuredMarkers.push(dot);

    return [
      new M.FadeIn(dot)
    ];
  }

  function markInput(q) {
    const x = gx(q);

    const marker = circle(
      x,
      GY0,
      0.085,
      BLUE,
      1,
      1.5
    );

    const tick = line(
      x,
      GY0 - 0.08,
      x,
      GY0 + 0.08,
      BLUE,
      2.5
    );

    const old = clearGuides();

    activeGuides = [
      marker,
      tick
    ];

    return [
      ...old,
      ...fadeIn(activeGuides)
    ];
  }

  function readPenalty(
    q,
    label,
    dx = 0.40,
    dy = 0.24
  ) {
    const p = graphPoint(q);

    const vertical = dashed(
      p[0],
      GY0,
      p[0],
      p[1],
      BLUE,
      1.8
    );

    const horizontal = dashed(
      GX0,
      p[1],
      p[0],
      p[1],
      VIOLET,
      1.8
    );

    const old = clearGuides();

    activeGuides = [
      vertical,
      horizontal
    ];

    return [
      ...old,
      new M.Create(vertical),
      new M.Create(horizontal),
      ...plotPenalty(
        q,
        label,
        dx,
        dy
      )
    ];
  }

  // ------------------------------------------------------------
  // 19: Prepare the graph.
  // ------------------------------------------------------------

  await until(S(19));
  await play(
    ...hideProbabilityRows(),
    ...clear('block-key'),
    ...clearBox(),
    ...showGraphFrame(),
    ...say('DRAW A PICTURE OF THE PENALTY')
  );

  // ------------------------------------------------------------
  // 20: Horizontal axis — chance of the actual outcome.
  // ------------------------------------------------------------

  await until(S(20));
  await play(
    ...showGraphX(),
    ...say('ACROSS: CHANCE ASSIGNED TO WHAT HAPPENED', BLUE)
  );

  // ------------------------------------------------------------
  // 21: Vertical axis — size of the penalty.
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    ...showGraphY(),
    ...say('UP: SIZE OF THE PENALTY', VIOLET)
  );

  // ------------------------------------------------------------
  // 22: At 100%, penalty = 0.
  // ------------------------------------------------------------

  await until(S(22));
  await play(
    ...plotPenalty(
      1,
      '100%: 0',
      -0.48,
      0.28,
      GREEN
    ),
    ...fbox([
      ['actual-outcome chance = 100%', BLUE],
      ['penalty = 0', GREEN],
      'perfect certainty about the outcome'
    ], GREEN),
    ...say('100% CHANCE OF THE ACTUAL OUTCOME → ZERO PENALTY', GREEN)
  );

  // ------------------------------------------------------------
  // 23: Halve the chance to 50%.
  //
  // -ln(0.5) = ln(2) ≈ 0.693.
  // ------------------------------------------------------------

  await until(S(23));
  await play(
    ...extendCurve(
      1,
      0.5,
      20,
      1.45
    ),
    ...plotPenalty(
      0.5,
      '0.69',
      0.44,
      0.21
    ),
    ...fbox([
      ['chance = 50%', BLUE],
      ['penalty ≈ 0.69', VIOLET]
    ], VIOLET),
    ...say('HALVE THE CHANCE TO 50%: PENALTY ≈ 0.69', VIOLET)
  );

  // ------------------------------------------------------------
  // 24: Halve the chance again, to 25%.
  //
  // -ln(0.25) = 2ln(2) ≈ 1.386.
  // ------------------------------------------------------------

  await until(S(24));
  await play(
    ...extendCurve(
      0.5,
      0.25,
      20,
      1.45
    ),
    ...plotPenalty(
      0.25,
      '1.39',
      0.47,
      0.20
    ),
    ...fbox([
      ['50% ÷ 2 = 25%', BLUE],
      ['penalty ≈ 1.39', VIOLET]
    ], VIOLET),
    ...say('HALVE AGAIN TO 25%: PENALTY ≈ 1.39', VIOLET)
  );

  // ------------------------------------------------------------
  // 25: Halve the chance again, to 12.5%.
  //
  // -ln(0.125) = 3ln(2) ≈ 2.079.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...extendCurve(
      0.25,
      0.125,
      22,
      1.55
    ),
    ...plotPenalty(
      0.125,
      '2.08',
      0.43,
      0.25
    ),
    ...fbox([
      ['25% ÷ 2 = 12.5%', BLUE],
      ['penalty ≈ 2.08', VIOLET]
    ], VIOLET),
    ...say('HALVE AGAIN TO 12.5%: PENALTY ≈ 2.08', VIOLET)
  );

  // ------------------------------------------------------------
  // 26: Equal multiplying steps give equal penalty increases.
  //
  // Every halving adds exactly ln(2), approximately 0.693.
  // ------------------------------------------------------------

  const HALVING_Q = [
    1,
    0.5,
    0.25,
    0.125
  ];

  const HALVING_Y = HALVING_Q.map(
    q => gy(penalty(q))
  );

  const stepX = gx(0.75);

  const equalSteps = [];

  for (let j = 0; j < 3; j++) {
    const bottom = HALVING_Y[j];
    const top = HALVING_Y[j + 1];

    equalSteps.push(
      line(
        stepX,
        bottom,
        stepX,
        top,
        AMBER,
        2.5
      ),

      line(
        stepX - 0.09,
        bottom,
        stepX + 0.09,
        bottom,
        AMBER,
        2
      ),

      line(
        stepX - 0.09,
        top,
        stepX + 0.09,
        top,
        AMBER,
        2
      ),

      text(
        '+0.69',
        P ? 15 : 13,
        AMBER,
        stepX + 0.48,
        (bottom + top) / 2,
        true,
        0.82
      )
    );
  }

  await until(S(26));
  await play(
    ...fadeIn(equalSteps),
    ...fbox([
      '0 → 0.693 → 1.386 → 2.079',
      ['each increase ≈ 0.693', AMBER],
      'every time the chance is halved'
    ], AMBER),
    ...say('EVERY HALVING ADDS THE SAME PENALTY', AMBER)
  );

  // ------------------------------------------------------------
  // 27: Extend the curve toward zero.
  //
  // Stop at the visible graph boundary:
  // q = exp(-GMAX), which is positive.
  //
  // Never evaluate or plot ln(0) as a finite value.
  // ------------------------------------------------------------

  const MIN_Q = Math.exp(-GMAX);

  const riseArrow = arrow(
    gx(MIN_Q) + 0.12,
    GY1 - 0.55,
    gx(MIN_Q) + 0.12,
    GY1 - 0.05,
    VIOLET,
    0.13,
    2.4
  );

  const riseLabel = text(
    'Steeper near zero',
    16,
    VIOLET,
    gx(0.39),
    gy(4.50),
    false,
    2.55
  );

  await until(S(27));
  await play(
    ...fadeOut(equalSteps),
    ...extendCurve(
      0.125,
      MIN_Q,
      38,
      2.15
    ),
    new M.FadeIn(riseArrow),
    new M.FadeIn(riseLabel),
    ...fbox([
      ['smaller and smaller chances', BLUE],
      ['larger and larger penalties', VIOLET]
    ], VIOLET),
    ...say('THE CURVE CLIMBS STEEPLY AS THE CHANCE APPROACHES ZERO', VIOLET)
  );

  // ------------------------------------------------------------
  // 28: Name the natural logarithm.
  //
  // The complete formula is still withheld.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...fbox([
      ['natural logarithm', VIOLET],
      'a mathematical calculation',
      'that gives this curve its shape'
    ], VIOLET),
    ...say('THIS CURVE USES THE NATURAL LOGARITHM', VIOLET)
  );

  // ------------------------------------------------------------
  // 29: Connect multiplication and addition.
  // ------------------------------------------------------------

  const halvingExplanation = new M.VGroup(
    rounded(
      CX + 1.15,
      gy(3.70),
      3.35,
      1.28,
      AMBER,
      C.card,
      0.95,
      1.8,
      0.12
    ),

    text(
      'CHANCE: DIVIDE BY 2',
      17,
      BLUE,
      CX + 1.15,
      gy(3.70) + 0.29,
      true,
      3.10
    ),

    text(
      'PENALTY: ADD 0.693...',
      17,
      VIOLET,
      CX + 1.15,
      gy(3.70) - 0.17,
      true,
      3.10
    )
  );

  await until(S(29));
  await play(
    new M.FadeOut(riseLabel),
    new M.FadeIn(halvingExplanation),
    ...fbox([
      ['equal multiplying steps', BLUE],
      'become',
      ['equal adding steps', VIOLET]
    ], VIOLET),
    ...say('LOGARITHMS TURN MULTIPLYING STEPS INTO ADDING STEPS')
  );

  // ------------------------------------------------------------
  // 30: Name log loss.
  // ------------------------------------------------------------

  await until(S(30));
  await play(
    new M.FadeOut(halvingExplanation),
    ...clearMeasuredMarkers(),
    ...fbox([
      ['LOG LOSS', VIOLET],
      'a penalty for the chance',
      'assigned to the actual outcome'
    ], VIOLET),
    ...say('THIS MEASURE IS CALLED LOG LOSS', VIOLET)
  );

  // ------------------------------------------------------------
  // 31: Prepare to read penalties for the three pumps.
  // ------------------------------------------------------------

  await until(S(31));
  await play(
    new M.FadeOut(riseArrow),
    ...clearBox(),
    ...fbox([
      ['our three pumps', WHITE],
      ['P2: actual-outcome chance 60%', BLUE],
      ['P3: actual-outcome chance 40%', BLUE],
      ['P1: actual-outcome chance 10%', BLUE]
    ], BLUE),
    ...say('USE THE CURVE TO MEASURE THE THREE MISTAKES')
  );

  // ------------------------------------------------------------
  // 32: Locate P2's probability on the horizontal axis.
  // ------------------------------------------------------------

  await until(S(32));
  await play(
    ...markInput(DATA[1].q),
    ...fbox([
      ['P2 actually failed', RED],
      ['chance assigned to failure = 60%', BLUE]
    ], BLUE),
    ...say('P2: LOCATE 60% ON THE HORIZONTAL AXIS', BLUE)
  );

  // ------------------------------------------------------------
  // 33: Read P2's penalty.
  // ------------------------------------------------------------

  await until(S(33));
  await play(
    ...readPenalty(
      DATA[1].q,
      'P2: 0.511',
      0.56,
      0.29
    ),
    ...fbox([
      ['actual-outcome chance = 0.6', BLUE],
      ['P2 penalty ≈ 0.511', VIOLET]
    ], VIOLET),
    ...say('P2: PENALTY ≈ 0.511', VIOLET)
  );

  // ------------------------------------------------------------
  // 34: Locate P3's actual-outcome probability.
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    ...markInput(DATA[2].q),
    ...fbox([
      ['P3 did not fail', GREEN],
      '100% − 60% = 40%',
      ['actual-outcome chance = 40%', BLUE]
    ], BLUE),
    ...say('P3: LOCATE 40% ON THE HORIZONTAL AXIS', BLUE)
  );

  // ------------------------------------------------------------
  // 35: Read P3's penalty.
  // ------------------------------------------------------------

  await until(S(35));
  await play(
    ...readPenalty(
      DATA[2].q,
      'P3: 0.916',
      0.28,
      0.36
    ),
    ...fbox([
      ['actual-outcome chance = 0.4', BLUE],
      ['P3 penalty ≈ 0.916', VIOLET]
    ], VIOLET),
    ...say('P3: PENALTY ≈ 0.916', VIOLET)
  );

  // ------------------------------------------------------------
  // 36: Locate P1's actual-outcome probability.
  // ------------------------------------------------------------

  await until(S(36));
  await play(
    ...markInput(DATA[0].q),
    ...fbox([
      ['P1 did not fail', GREEN],
      '100% − 90% = 10%',
      ['actual-outcome chance = 10%', BLUE]
    ], BLUE),
    ...say('P1: LOCATE ONLY 10% ON THE HORIZONTAL AXIS', BLUE)
  );

  // ------------------------------------------------------------
  // 37: Read P1's much larger penalty.
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...readPenalty(
      DATA[0].q,
      'P1: 2.303',
      0.73,
      0.26
    ),
    ...fbox([
      ['P2 ≈ 0.511', VIOLET],
      ['P3 ≈ 0.916', VIOLET],
      ['P1 ≈ 2.303', AMBER]
    ], VIOLET),
    ...say('P1 RECEIVES A MUCH LARGER PENALTY: 2.303', AMBER)
  );

  // ------------------------------------------------------------
  // Twelve-pump calculation grid.
  //
  // Each card shows:
  //   - pump identity and icon;
  //   - original predicted failure chance;
  //   - actual failure or non-failure symbol;
  //   - chance q assigned to the actual outcome;
  //   - the corresponding penalty;
  //   - a proportional violet penalty bar.
  //
  // Every penalty bar uses the same numerical scale.
  // ------------------------------------------------------------

  const GRID_SCALE = P ? 0.88 : 0.60;

  const GRID_SPX = P ? 1.58 : 1.66;
  const GRID_SPY = P ? 1.72 : 1.40;

  const GRID_TOP = P ? 1.12 : 1.03;

  const MINI_BAR_W = P ? 1.23 : 1.31;
  const MINI_BAR_MAX = 2.5;

  function gridPosition(i) {
    return [
      CX + (i % 4 - 1.5) * GRID_SPX,

      GRID_TOP -
        Math.floor(i / 4) * GRID_SPY,

      0
    ];
  }

  function miniPenaltyBar(i) {
    const p = gridPosition(i);
    const d = DATA[i];

    const x = p[0];
    const y =
      p[1] - CARD_H * GRID_SCALE / 2;

    const qText = text(
      `q = ${fmt(d.q, 1)}`,
      P ? 15 : 13,
      BLUE,
      x,
      y - 0.17,
      true,
      1.34
    );

    const lossText = text(
      `≈ ${fmt(d.loss)}`,
      P ? 17 : 15,
      VIOLET,
      x,
      y - 0.38,
      true,
      1.34
    );

    const barY = y - 0.56;

    const track = rounded(
      x,
      barY,
      MINI_BAR_W,
      0.095,
      C.muted,
      C.card,
      0.35,
      1,
      0.025
    );

    const width =
      MINI_BAR_W * d.loss / MINI_BAR_MAX;

    const fill = rect(
      x - MINI_BAR_W / 2 + width / 2,
      barY,
      width,
      0.095,
      VIOLET,
      0.93,
      0.8
    );

    return new M.VGroup(
      qText,
      lossText,
      track,
      fill
    );
  }

  function makeGrid() {
    return {
      cards: IDS.map(i => {
        const p = gridPosition(i);

        return completeCard(
          i,
          p[0],
          p[1],
          GRID_SCALE
        );
      }),

      penalties: IDS.map(i =>
        miniPenaltyBar(i)
      )
    };
  }

  const originalGrid = makeGrid();

  const TOTAL_Y = P
    ? -4.00
    : -3.10;

  const gridTotal = text(
    `TOTAL ≈ ${fmt(TOTAL)}`,
    P ? 27 : 24,
    VIOLET,
    CX,
    TOTAL_Y,
    true,
    6.55
  );

  // ------------------------------------------------------------
  // 38: Calculate all twelve penalties.
  // ------------------------------------------------------------

  await until(S(38));
  await play(
    ...hideGraph(),
    ...clearBox(),
    lag(
      fadeIn(originalGrid.cards),
      1.15,
      0.06
    ),
    lag(
      fadeIn(originalGrid.penalties),
      2.20,
      0.11
    ),
    ...fbox([
      ['q = chance of actual outcome', BLUE],
      ['violet bar = penalty', VIOLET],
      'calculate one for each pump'
    ]),
    ...say('CALCULATE A PENALTY FOR ALL TWELVE PUMPS', VIOLET)
  );

  // ------------------------------------------------------------
  // 39: Sum unrounded penalties.
  //
  // The displayed rounded values are explanatory labels only.
  // TOTAL is computed from full-precision Math.log results.
  // ------------------------------------------------------------

  await until(S(39));
  await play(
    new M.FadeIn(gridTotal),
    ...fbox([
      ['add all 12 penalties', VIOLET],
      'use full calculation results',
      ['sum ≈ 6.279', VIOLET]
    ], VIOLET),
    ...say('SUM OF THE UNROUNDED PENALTIES ≈ 6.279', VIOLET)
  );

  // ------------------------------------------------------------
  // 40: Divide by twelve.
  // ------------------------------------------------------------

  const gridMean = text(
    `6.279... ÷ 12 ≈ ${fmt(MEAN)}`,
    P ? 27 : 23,
    VIOLET,
    CX,
    TOTAL_Y,
    true,
    6.60
  );

  await until(S(40));
  await play(
    new M.FadeOut(gridTotal),
    new M.FadeIn(gridMean),
    ...fbox([
      ['total penalty ≈ 6.279', VIOLET],
      'number of predictions = 12',
      ['mean ≈ 0.523', VIOLET]
    ], VIOLET),
    ...say('DIVIDE THE TOTAL BY TWELVE: ABOUT 0.523')
  );

  // ------------------------------------------------------------
  // 41: Name the mean log loss.
  // ------------------------------------------------------------

  const meanLogLossLabel = text(
    `MEAN LOG LOSS ≈ ${fmt(MEAN)}`,
    P ? 28 : 24,
    VIOLET,
    CX,
    TOTAL_Y,
    true,
    6.65
  );

  await until(S(41));
  await play(
    new M.FadeOut(gridMean),
    new M.FadeIn(meanLogLossLabel),
    ...fbox([
      ['MEAN LOG LOSS', VIOLET],
      'average penalty across',
      'all twelve predictions'
    ], VIOLET),
    ...say('TOOL A: MEAN LOG LOSS ≈ 0.523', VIOLET)
  );

  // ------------------------------------------------------------
  // Formula demonstration.
  //
  // Introduce the formula only after the probability bars,
  // penalty curve, worked examples and twelve-pump mean.
  // ------------------------------------------------------------

  const FORMULA_Y = P ? -0.95 : -0.55;
  const FORMULA_W = P ? 6.45 : 6.70;
  const FORMULA_H = P ? 4.55 : 3.65;

  const formulaFrame = rounded(
    CX,
    FORMULA_Y,
    FORMULA_W,
    FORMULA_H,
    VIOLET,
    C.card,
    0.94,
    2,
    0.17
  );

  const formulaHeading = text(
    'CALCULATING LOG LOSS',
    22,
    VIOLET,
    CX,
    FORMULA_Y + FORMULA_H / 2 - 0.30,
    true,
    FORMULA_W - 0.35
  );

  const FORMULA_STEP_Y = P
    ? FORMULA_Y + 0.68
    : FORMULA_Y + 0.52;

  function formulaStep(
    title,
    expression,
    color
  ) {
    return [
      text(
        title,
        18,
        WHITE,
        CX,
        FORMULA_STEP_Y + 0.43,
        false,
        FORMULA_W - 0.40
      ),

      text(
        expression,
        P ? 30 : 27,
        color,
        CX,
        FORMULA_STEP_Y - 0.05,
        true,
        FORMULA_W - 0.45
      )
    ];
  }

  // ------------------------------------------------------------
  // 42: Prepare the formula.
  // ------------------------------------------------------------

  await until(S(42));
  await play(
    ...fadeOut([
      ...originalGrid.cards,
      ...originalGrid.penalties,
      meanLogLossLabel
    ]),
    ...clearBox(),
    ...replace('formula-frame', [
      formulaFrame,
      formulaHeading
    ]),
    ...say('NOW WRITE THE CALCULATION AS A SHORT FORMULA')
  );

  // ------------------------------------------------------------
  // 43: q = probability assigned to the actual outcome.
  //
  // q is in the interval [0,1].
  //
  // If failure happened, q = p.
  // If failure did not happen, q = 1-p.
  // ------------------------------------------------------------

  await until(S(43));
  await play(
    ...replace('formula-step', [
      ...formulaStep(
        'Chance assigned to what happened',
        'q between 0 and 1',
        BLUE
      ),

      text(
        'If failure happened: q = p',
        18,
        RED,
        CX,
        FORMULA_Y - 0.47,
        true,
        FORMULA_W - 0.40
      ),

      text(
        'If no failure happened: q = 1 − p',
        18,
        GREEN,
        CX,
        FORMULA_Y - 0.90,
        true,
        FORMULA_W - 0.40
      )
    ]),
    ...fbox([
      ['p = predicted failure chance', BLUE],
      ['q = chance of actual outcome', AMBER]
    ]),
    ...say('FIRST FIND THE CHANCE ASSIGNED TO WHAT HAPPENED', BLUE)
  );

  // ------------------------------------------------------------
  // 44: Convert 60% into 0.6.
  // ------------------------------------------------------------

  await until(S(44));
  await play(
    ...replace('formula-step',
      formulaStep(
        'Convert the percentage to a decimal',
        '60% ÷ 100 = 0.6',
        BLUE
      )
    ),
    ...fbox([
      ['example: P2', WHITE],
      '60 ÷ 100',
      ['q = 0.6', BLUE]
    ], BLUE),
    ...say('SIXTY PERCENT BECOMES ZERO POINT SIX', BLUE)
  );

  // ------------------------------------------------------------
  // Calculator illustration.
  //
  // The LN button is a visual demonstration, not an
  // interactive control in this narrated scene.
  // ------------------------------------------------------------

  const CALC_Y = FORMULA_Y - 0.62;

  function calculatorPicture(
    display,
    highlightLN = false
  ) {
    const frame = rounded(
      CX,
      CALC_Y,
      3.25,
      1.30,
      C.muted,
      C.card,
      0.98,
      2,
      0.14
    );

    const screen = rounded(
      CX,
      CALC_Y + 0.34,
      2.84,
      0.37,
      BLUE,
      BLUE,
      0.08,
      1.5,
      0.05
    );

    const displayText = text(
      display,
      20,
      WHITE,
      CX,
      CALC_Y + 0.34,
      true,
      2.60
    );

    const keyNames = [
      '7',
      '8',
      '9',
      'LN'
    ];

    const keys = keyNames.flatMap((s, j) => {
      const x =
        CX + (j - 1.5) * 0.68;

      const active =
        s === 'LN' && highlightLN;

      return [
        rounded(
          x,
          CALC_Y - 0.30,
          0.58,
          0.40,
          active ? AMBER : C.muted,
          active ? AMBER : C.card,
          active ? 0.26 : 0.90,
          active ? 2.5 : 1.5,
          0.05
        ),

        text(
          s,
          16,
          active ? AMBER : WHITE,
          x,
          CALC_Y - 0.30,
          true
        )
      ];
    });

    return new M.VGroup(
      frame,
      screen,
      displayText,
      ...keys
    );
  }

  // ------------------------------------------------------------
  // 45: Use the natural logarithm.
  //
  // ln(0.6) = -0.510825623...
  // ------------------------------------------------------------

  await until(S(45));
  await play(
    ...replace(
      'formula-step',
      formulaStep(
        'Find the natural logarithm',
        'ln(0.6) ≈ −0.511',
        WHITE
      )
    ),
    ...replace('calculator', [
      calculatorPicture(
        '−0.5108256',
        true
      )
    ]),
    ...fbox([
      ['calculator button: LN', AMBER],
      'ln(0.6)',
      '= −0.510825623...'
    ]),
    ...say('USE THE CALCULATOR BUTTON MARKED LN', AMBER)
  );

  // ------------------------------------------------------------
  // 46: Change the sign.
  //
  // ln(q) <= 0 for 0 < q <= 1.
  // Therefore -ln(q) >= 0.
  // ------------------------------------------------------------

  const positivePenalty = text(
    'Penalty = −ln(q)',
    20,
    VIOLET,
    CX,
    FORMULA_Y - 0.58,
    true,
    FORMULA_W - 0.45
  );

  const positiveNote = text(
    'Positive or zero for a nonzero probability',
    16,
    GREEN,
    CX,
    FORMULA_Y - 1.02,
    false,
    FORMULA_W - 0.45
  );

  await until(S(46));
  await play(
    ...clear('calculator'),
    ...replace(
      'formula-step',
      formulaStep(
        'Change the sign',
        '−(−0.511...) ≈ 0.511',
        VIOLET
      )
    ),
    ...replace('positive-penalty', [
      positivePenalty,
      positiveNote
    ]),
    ...fbox([
      ['individual penalty', VIOLET],
      '= −ln(q)',
      ['P2 ≈ 0.511', VIOLET]
    ], VIOLET),
    ...say('CHANGE THE SIGN TO GET A NONNEGATIVE PENALTY', VIOLET)
  );

  // ------------------------------------------------------------
  // 47: Average the penalties.
  //
  // Mean log loss = (1/n) Σ[-ln(q_i)].
  //
  // Equivalent binary-event form:
  //
  // -(1/n) Σ[y_i ln(p_i) + (1-y_i) ln(1-p_i)].
  //
  // Use the actual-outcome probability form on screen because
  // it is directly connected to the probability-block picture.
  // ------------------------------------------------------------

  const meanFormulaNumerator = text(
    'Sum of all −ln(q) penalties',
    21,
    VIOLET,
    CX,
    FORMULA_Y + 0.40,
    true,
    FORMULA_W - 0.65
  );

  const meanFormulaLine = line(
    CX - FORMULA_W / 2 + 0.52,
    FORMULA_Y + 0.10,
    CX + FORMULA_W / 2 - 0.52,
    FORMULA_Y + 0.10,
    WHITE,
    2
  );

  const meanFormulaDenominator = text(
    'Number of predictions',
    21,
    WHITE,
    CX,
    FORMULA_Y - 0.20,
    true,
    FORMULA_W - 0.65
  );

  const symbolicFormula = text(
    'Mean log loss = Σ[−ln(qᵢ)] / n',
    P ? 23 : 21,
    VIOLET,
    CX,
    FORMULA_Y - 0.79,
    true,
    FORMULA_W - 0.45
  );

  const formulaResult = text(
    'Here: 6.279... ÷ 12 ≈ 0.523',
    19,
    WHITE,
    CX,
    FORMULA_Y - 1.19,
    true,
    FORMULA_W - 0.45
  );

  await until(S(47));
  await play(
    ...clear(
      'formula-step',
      'positive-penalty'
    ),
    ...replace('mean-formula', [
      meanFormulaNumerator,
      meanFormulaLine,
      meanFormulaDenominator,
      symbolicFormula,
      formulaResult
    ]),
    ...fbox([
      ['mean log loss', VIOLET],
      'sum of all penalties',
      '÷ number of predictions',
      ['≈ 0.523 here', VIOLET]
    ], VIOLET),
    ...say('ADD THE PENALTIES AND DIVIDE BY THE NUMBER OF PREDICTIONS')
  );

  // ------------------------------------------------------------
  // Penalty comparison bars.
  //
  // All bars use the same numerical scale.
  // Width is proportional to the exact negative logarithm.
  // ------------------------------------------------------------

  const COMPARE_LEFT = CX - 1.70;
  const COMPARE_W = 4.65;
  const COMPARE_MAX = 2.5;

  const COMPARE_Y = P
    ? [0.75, -0.75, -2.25]
    : [0.86, -0.35, -1.56];

  function comparisonRow(i, j) {
    const d = DATA[i];
    const y = COMPARE_Y[j];

    const width =
      COMPARE_W * d.loss / COMPARE_MAX;

    const card = completeCard(
      i,
      CX - 2.57,
      y,
      0.83
    );

    const track = rounded(
      COMPARE_LEFT + COMPARE_W / 2,
      y,
      COMPARE_W,
      0.29,
      C.muted,
      C.card,
      0.35,
      1.3,
      0.06
    );

    const fill = rect(
      COMPARE_LEFT + width / 2,
      y,
      width,
      0.29,
      VIOLET,
      0.87,
      1.3
    );

    const description = text(
      `Chance of actual outcome: ${pct(d.q)}`,
      15,
      BLUE,
      COMPARE_LEFT + COMPARE_W / 2,
      y + 0.35,
      false,
      COMPARE_W
    );

    const result = text(
      `Penalty ≈ ${fmt(d.loss)}`,
      17,
      VIOLET,
      COMPARE_LEFT + COMPARE_W / 2,
      y - 0.37,
      true,
      COMPARE_W
    );

    return new M.VGroup(
      card,
      track,
      fill,
      description,
      result
    );
  }

  const comparisonRows = [
    comparisonRow(1, 0),
    comparisonRow(2, 1),
    comparisonRow(0, 2)
  ];

  // ------------------------------------------------------------
  // 48: Use log loss when confident mistakes are especially
  // undesirable.
  // ------------------------------------------------------------

  await until(S(48));
  await play(
    ...clear(
      'formula-frame',
      'mean-formula'
    ),
    lag(
      fadeIn(comparisonRows),
      1.60,
      0.22
    ),
    ...fbox([
      ['USE LOG LOSS', VIOLET],
      'compare probability predictions',
      ['when confident mistakes matter', AMBER]
    ], VIOLET),
    ...say('USE LOG LOSS WHEN BEING CONFIDENTLY WRONG IS ESPECIALLY BAD', VIOLET)
  );

  // ------------------------------------------------------------
  // Restore the full penalty curve.
  // ------------------------------------------------------------

  function restoreFullGraph() {
    const anims = [
      ...showGraphFrame(),
      ...showGraphX(),
      ...showGraphY()
    ];

    const fullCurve = curvePart(
      1,
      MIN_Q,
      85
    );

    curveSegments.push(...fullCurve);

    anims.push(
      ...fadeIn(fullCurve)
    );

    return anims;
  }

  // ------------------------------------------------------------
  // 49: Smaller is better; zero is best.
  // ------------------------------------------------------------

  await until(S(49));
  await play(
    ...fadeOut(comparisonRows),
    ...restoreFullGraph(),
    ...plotPenalty(
      1,
      'Best = 0',
      -0.55,
      0.30,
      GREEN
    ),
    ...fbox([
      ['smaller log loss is better', GREEN],
      'when evaluated on comparable data',
      ['best possible score = 0', GREEN]
    ], GREEN),
    ...say('SMALLER IS BETTER · ZERO IS BEST', GREEN)
  );

  // ------------------------------------------------------------
  // 50: Consider only a 1% probability of the actual outcome.
  //
  // This is a hypothetical forecast, not an additional pump.
  // ------------------------------------------------------------

  const ONE_PERCENT = 0.01;

  const onePercentPoint =
    graphPoint(ONE_PERCENT);

  const onePercentInputLabel = text(
    '1%',
    17,
    BLUE,
    gx(ONE_PERCENT) + 0.30,
    GY0 + 0.22,
    true
  );

  await until(S(50));
  await play(
    ...markInput(ONE_PERCENT),
    ...replace('one-percent-label', [
      onePercentInputLabel
    ]),
    ...fbox([
      ['hypothetical forecast', WHITE],
      ['actual-outcome chance = 1%', BLUE],
      'what penalty does this receive?'
    ], AMBER),
    ...say('WHAT IF THE ACTUAL OUTCOME HAD ONLY A 1% CHANCE?', AMBER)
  );

  // ------------------------------------------------------------
  // 51: At q = 0.01, penalty ≈ 4.605.
  // ------------------------------------------------------------

  await until(S(51));
  await play(
    ...readPenalty(
      ONE_PERCENT,
      '4.605',
      0.75,
      0.12
    ),
    ...fbox([
      ['q = 0.01', BLUE],
      '−ln(0.01)',
      ['penalty ≈ 4.605', VIOLET]
    ], VIOLET),
    ...say('A 1% CHANCE PRODUCES A PENALTY OF ABOUT 4.605', VIOLET)
  );

  // ------------------------------------------------------------
  // 52: Zero probability for the actual outcome.
  //
  // As q approaches 0 through positive values,
  // -ln(q) increases without bound.
  //
  // At q = 0, log loss is infinite in the extended-real
  // interpretation. Do not draw a dot at a finite height.
  //
  // Do not clip probabilities or replace zero with an epsilon
  // in the mathematical calculation.
  // ------------------------------------------------------------

  const unboundedArrow = arrow(
    gx(MIN_Q) + 0.13,
    GY1 - 0.65,
    gx(MIN_Q) + 0.13,
    GY1 + 0.06,
    AMBER,
    0.16,
    3.0
  );

  const infinityLabel = text(
    'No upper limit',
    17,
    AMBER,
    gx(0.37),
    gy(5.02),
    false,
    2.80
  );

  const zeroBoundary = dashed(
    GX0,
    GY0,
    GX0,
    GY1,
    AMBER,
    2.2
  );

  await until(S(52));
  await play(
    ...clearGuides(),
    ...clear('one-percent-label'),
    new M.Create(zeroBoundary),
    new M.FadeIn(unboundedArrow),
    new M.FadeIn(infinityLabel),
    ...fbox([
      ['q approaches zero', BLUE],
      ['penalty grows without bound', AMBER],
      ['q = 0: infinite loss', VIOLET]
    ], VIOLET),
    ...say('ZERO CHANCE FOR WHAT HAPPENS → INFINITE LOSS', AMBER)
  );

  // ------------------------------------------------------------
  // 53: One extremely confident mistake can overwhelm many
  // other prediction results.
  //
  // Compare the hypothetical q = 0.01 forecast with the six
  // original safe pumps P7–P12.
  //
  // The six original penalties are:
  //   6 × -ln(0.9) ≈ 0.632.
  //
  // One hypothetical 1% actual-outcome probability:
  //   -ln(0.01) ≈ 4.605.
  //
  // These are clearly distinguished as measured chapter
  // results versus a hypothetical comparison.
  // ------------------------------------------------------------

  const SIX_IDS = [6, 7, 8, 9, 10, 11];

  const SIX_TOTAL = SIX_IDS.reduce(
    (sum, i) => sum + DATA[i].loss,
    0
  );

  const HYP_LOSS = penalty(ONE_PERCENT);

  const WARN_W = 5.68;
  const WARN_LEFT = CX - WARN_W / 2;
  const WARN_MAX = 5;

  const WARN_Y1 = P ? -0.80 : -0.58;
  const WARN_Y2 = P ? -2.65 : -1.93;

  function warningBar(
    y,
    value,
    label,
    color
  ) {
    const width =
      WARN_W * value / WARN_MAX;

    return new M.VGroup(
      text(
        label,
        17,
        WHITE,
        CX,
        y + 0.39,
        false,
        WARN_W
      ),

      rounded(
        CX,
        y,
        WARN_W,
        0.32,
        C.muted,
        C.card,
        0.35,
        1.5,
        0.06
      ),

      rect(
        WARN_LEFT + width / 2,
        y,
        width,
        0.32,
        color,
        0.88,
        1
      ),

      text(
        `Total penalty ≈ ${fmt(value)}`,
        19,
        color,
        CX,
        y - 0.40,
        true,
        WARN_W
      )
    );
  }

  const sixSafeCards = SIX_IDS.map((i, j) =>
    completeCard(
      i,
      CX + (j - 2.5) * 0.99,
      P ? 0.65 : 0.83,
      0.68
    )
  );

  const sixLossBar = warningBar(
    WARN_Y1,
    SIX_TOTAL,
    'Six original predictions: P7–P12',
    VIOLET
  );

  const hypotheticalLossBar = warningBar(
    WARN_Y2,
    HYP_LOSS,
    'One hypothetical 1% actual-outcome chance',
    AMBER
  );

  await until(S(53));
  await play(
    ...hideGraph(),
    new M.FadeOut(zeroBoundary),
    new M.FadeOut(unboundedArrow),
    new M.FadeOut(infinityLabel),
    ...fadeIn(sixSafeCards),
    new M.FadeIn(sixLossBar),
    new M.FadeIn(hypotheticalLossBar),
    ...fbox([
      ['six original penalties ≈ 0.632', VIOLET],
      ['one hypothetical penalty ≈ 4.605', AMBER],
      'one large penalty can dominate'
    ], AMBER),
    ...say('ONE CONFIDENT MISTAKE CAN OVERWHELM MANY OTHER RESULTS', AMBER)
  );

  // ------------------------------------------------------------
  // 54: Final recap.
  //
  // Return to the original twelve-pump dataset.
  //
  // Reinforce:
  //   - use the chance assigned to what actually happens;
  //   - larger assigned chances receive smaller penalties;
  //   - confident wrong predictions receive large penalties;
  //   - average the penalties over the evaluation cases;
  //   - smaller mean log loss is better.
  //
  // The hypothetical comparison is removed completely.
  // ------------------------------------------------------------

  const finalGrid = makeGrid();

  const finalScore = text(
    `MEAN LOG LOSS ≈ ${fmt(MEAN)}`,
    P ? 28 : 24,
    VIOLET,
    CX,
    TOTAL_Y,
    true,
    6.65
  );

  const finalNote = text(
    'High chance of what happens → small penalty',
    17,
    GREEN,
    CX,
    P ? -4.62 : -3.60,
    false,
    6.60
  );

  await until(S(54));
  await play(
    ...fadeOut([
      ...sixSafeCards,
      sixLossBar,
      hypotheticalLossBar
    ]),
    lag(
      fadeIn(finalGrid.cards),
      1.25,
      0.06
    ),
    lag(
      fadeIn(finalGrid.penalties),
      1.65,
      0.08
    ),
    new M.FadeIn(finalScore),
    ...(P
      ? [new M.FadeIn(finalNote)]
      : []),
    ...fbox([
      ['LOG LOSS', VIOLET],
      'penalty = −ln(actual-outcome chance)',
      'average over all predictions',
      ['smaller is better', GREEN]
    ], VIOLET),
    ...say('CONFIDENT MISTAKES GET BIG PENALTIES', VIOLET)
  );

  // Hold the completed recap until the narration finishes.
  await until(E(54));
}
