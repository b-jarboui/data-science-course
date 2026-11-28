// lesson 12.4.7
// Precision–recall curves: how trustworthy are our alerts?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Browser playback and narration seeking have not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Shared chapter data — fixed.
  //
  // These twelve pumps were not used to train either tool.
  // Tool A predicts failure within the next ten hours.
  //
  // An alert is raised when probability >= threshold.
  // ------------------------------------------------------------

  const PUMPS = [
    'P1', 'P2', 'P3', 'P4',
    'P5', 'P6', 'P7', 'P8',
    'P9', 'P10', 'P11', 'P12'
  ];

  const ACTUAL_HOURS = [
    12, 8, 14, 6, 16, 20,
    18, 22, 24, 26, 28, 30
  ];

  const TOOL_A_HOURS = [
    18, 8, 14, 8, 15, 22,
    17, 22, 25, 24, 28, 31
  ];

  const TOOL_B_HOURS = [
    14, 10, 12, 7, 14, 20,
    20, 21, 24, 25, 28, 30
  ];

  const PROBABILITIES = [
    90, 60, 60, 30, 30, 30,
    10, 10, 10, 10, 10, 10
  ];

  const FAILED = ACTUAL_HOURS.map(h => h <= 10);

  const N = PUMPS.length;

  const FAILURE_COUNT = FAILED.filter(Boolean).length;

  const SAFE_COUNT = N - FAILURE_COUNT;

  const FAILURE_RATE = FAILURE_COUNT / N;

  const THRESHOLDS = [90, 60, 30, 10];

  function evaluate(threshold) {
    const alerted = PROBABILITIES.map(
      p => p >= threshold
    );

    const tp = alerted.filter(
      (a, i) => a && FAILED[i]
    ).length;

    const fp = alerted.filter(
      (a, i) => a && !FAILED[i]
    ).length;

    const fn = alerted.filter(
      (a, i) => !a && FAILED[i]
    ).length;

    const tn = alerted.filter(
      (a, i) => !a && !FAILED[i]
    ).length;

    const alerts = tp + fp;

    return {
      threshold,
      alerted,
      tp,
      fp,
      fn,
      tn,
      alerts,
      precision: alerts === 0
        ? null
        : tp / alerts,
      recall: tp / FAILURE_COUNT
    };
  }

  const RESULTS = THRESHOLDS.map(evaluate);

  const NO_ALERTS = evaluate(100);

  // Checked results:
  //
  // Threshold 90%:
  //   Alerts: P1.
  //   TP = 0, FP = 1, FN = 2, TN = 9.
  //   Precision = 0/1 = 0%.
  //   Recall    = 0/2 = 0%.
  //
  // Threshold 60%:
  //   Alerts: P1, P2, P3.
  //   TP = 1, FP = 2, FN = 1, TN = 8.
  //   Precision = 1/3 ≈ 33%.
  //   Recall    = 1/2 = 50%.
  //
  // Threshold 30%:
  //   Alerts: P1 through P6.
  //   TP = 2, FP = 4, FN = 0, TN = 6.
  //   Precision = 2/6 = 1/3 ≈ 33%.
  //   Recall    = 2/2 = 100%.
  //
  // Threshold 10%:
  //   Alerts: all twelve pumps.
  //   TP = 2, FP = 10, FN = 0, TN = 0.
  //   Precision = 2/12 = 1/6 ≈ 17%.
  //   Recall    = 2/2 = 100%.
  //
  // Threshold 100%:
  //   No alerts.
  //   TP = 0, FP = 0, FN = 2, TN = 10.
  //   Precision is undefined: 0/0.
  //   Recall = 0/2 = 0%.
  //
  // The measured precision–recall points are:
  //   (0,   0)
  //   (0.5, 1/3)
  //   (1,   1/3)
  //   (1,   1/6)
  //
  // Reference precision = failure prevalence = 2/12.
  //
  // No artificial point at (0, 1) is added.
  // Such a point can be a plotting convention, but it is not
  // measured precision at the 100% threshold.

  const BLUE = C.blue || C.cyan;
  const RED = C.red || '#FF647C';
  const GREEN = C.green;
  const AMBER = C.amber;

  function pct(v) {
    if (v === null) return 'Undefined';

    const p = 100 * v;

    if (Math.abs(p - Math.round(p)) < 1e-8) {
      return `${Math.round(p)}%`;
    }

    return `≈${Math.round(p)}%`;
  }

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22.
  // Content between y = -5.5 and y = 4.3.
  //
  // Laptop: 14.22 x 8.
  // Content between y = -3.0 and y = 2.3.
  //
  // Phone: pump cards above graph.
  // Laptop: pump cards left, graph right.
  // ------------------------------------------------------------

  const PILL = P
    ? [0, 3.91, 0]
    : [0, 1.96, 0];

  const BOXP = P
    ? [0, -4.98, 0]
    : [0, -2.80, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ------------------------------------------------------------
  // Drawing helpers.
  // ------------------------------------------------------------

  function txt(
    s,
    size,
    color,
    p,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    w,
    h,
    p,
    color,
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

  function solidRect(
    w,
    h,
    p,
    color,
    opacity = 0.85
  ) {
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

  function circle(
    radius,
    p,
    color,
    fill = 0,
    stroke = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: stroke
    });

    c.setFill(color, fill);
    c.moveTo(p);

    return c;
  }

  function line(
    a,
    b,
    color = C.muted,
    strokeWidth = 2
  ) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function arrow(
    a,
    b,
    color = C.cyan,
    strokeWidth = 2.5
  ) {
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
    objects
      .filter(Boolean)
      .map(o => new M.FadeIn(o));

  const outs = objects =>
    objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));

  function lagIn(
    objects,
    runTime = 1.0,
    lagRatio = 0.10
  ) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function indicateAll(
    objects,
    color,
    runTime = 1.15
  ) {
    return new M.LaggedStart(
      objects.map(o =>
        new M.Indicate(o, { color })
      ),
      {
        lagRatio: 0.10,
        runTime
      }
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style.
  //
  // Each row is either a string or [string, color].
  // Leading spaces specify indentation.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20;

    const lh = P ? 0.29 : 0.28;

    const padding = P ? 0.20 : 0.18;

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

      const indent =
        s.length - s.trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.62;

    const ht = rows.length * lh + padding;

    const bg = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    bg.setFill(C.card, 0.96);
    bg.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.31;

    const top =
      BOXP[1] + ht / 2 - padding / 2 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];

      const indent =
        cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(bg, ...texts);

    const maxw = P ? FW - 0.60 : FW - 1.30;

    const maxh = P ? 0.96 : 0.96;

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
  // Chapter picture language.
  //
  // Small pump icons on numbered cards.
  //
  // Tool A's probabilities: blue.
  // Actual failure: red filled diamond.
  // No failure: green outlined circle.
  // Alert: amber bell and amber outline.
  //
  // Actual outcomes and model alerts are separate objects.
  // Their meanings never change.
  // ------------------------------------------------------------

  function pumpIcon(x, y, scale = 1, color = C.ink) {
    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const motor = rect(
      0.72 * scale,
      0.49 * scale,
      p(-0.25, 0),
      color,
      0.13,
      1.6,
      0.08 * scale
    );

    const housing = circle(
      0.31 * scale,
      p(0.25, 0),
      color,
      0.12,
      1.8
    );

    const hub = circle(
      0.085 * scale,
      p(0.25, 0),
      color,
      0.88,
      1
    );

    const blades = [];

    for (let i = 0; i < 3; i++) {
      const a = i * 2 * Math.PI / 3;

      blades.push(
        line(
          p(
            0.25 + 0.10 * Math.cos(a),
            0.10 * Math.sin(a)
          ),
          p(
            0.25 + 0.22 * Math.cos(a + 0.40),
            0.22 * Math.sin(a + 0.40)
          ),
          color,
          1.7
        )
      );
    }

    const inlet = line(
      p(-0.63, 0),
      p(-0.91, 0),
      color,
      2.4
    );

    const outlet = [
      line(
        p(0.25, 0.31),
        p(0.25, 0.60),
        color,
        2.4
      ),
      line(
        p(0.25, 0.60),
        p(0.65, 0.60),
        color,
        2.4
      )
    ];

    const feet = [
      line(
        p(-0.42, -0.25),
        p(-0.42, -0.40),
        color,
        2
      ),
      line(
        p(0.38, -0.27),
        p(0.38, -0.40),
        color,
        2
      ),
      line(
        p(-0.68, -0.40),
        p(0.62, -0.40),
        color,
        2
      )
    ];

    return new M.VGroup(
      motor,
      housing,
      hub,
      ...blades,
      inlet,
      ...outlet,
      ...feet
    );
  }

  function diamond(x, y, radius, color = RED) {
    // A rotated square provides a filled diamond without
    // depending on a custom polygon implementation.

    const side = radius * Math.sqrt(2);

    const d = new M.Rectangle({
      width: side,
      height: side,
      color,
      strokeWidth: 1.5
    });

    d.setFill(color, 1);
    d.rotate(Math.PI / 4);
    d.moveTo([x, y, 0]);

    return d;
  }

  function outcomeSymbol(failed, x, y, radius) {
    if (failed) {
      return diamond(x, y, radius, RED);
    }

    return circle(
      radius * 0.87,
      [x, y, 0],
      GREEN,
      0,
      2
    );
  }

  function bellIcon(x, y, scale = 1) {
    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const dome = new M.Circle({ radius: 0.17 * scale, color: AMBER, strokeWidth: 2 });
    dome.setFill(AMBER, 0);

    dome.moveTo(p(0, 0.055));

    const body = rect(
      0.34 * scale,
      0.17 * scale,
      p(0, -0.055),
      AMBER,
      0.82,
      1,
      0.025 * scale
    );

    const skirt = line(
      p(-0.23, -0.15),
      p(0.23, -0.15),
      AMBER,
      2.6
    );

    const top = new M.Dot({
      point: p(0, 0.22),
      radius: 0.045 * scale,
      color: AMBER
    });

    const clapper = new M.Dot({
      point: p(0, -0.225),
      radius: 0.055 * scale,
      color: AMBER
    });

    return new M.VGroup(
      dome,
      body,
      skirt,
      top,
      clapper
    );
  }

  function workerIcon(x, y, scale = 1) {
    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const head = circle(
      0.20 * scale,
      p(0, 0.58),
      C.ink,
      0.92,
      1.5
    );

    const helmet = new M.Arc({
      radius: 0.26 * scale,
      startAngle: 0,
      angle: Math.PI,
      color: AMBER,
      strokeWidth: 2.2
    });

    helmet.setFill(AMBER, 0.86);
    helmet.moveTo(p(0, 0.73));

    const brim = line(
      p(-0.31, 0.68),
      p(0.31, 0.68),
      AMBER,
      3
    );

    const torso = line(
      p(0, 0.33),
      p(0, -0.28),
      C.ink,
      4.5
    );

    const limbs = [
      line(
        p(0, 0.24),
        p(-0.32, -0.06),
        C.ink,
        3.5
      ),
      line(
        p(0, 0.24),
        p(0.34, -0.03),
        C.ink,
        3.5
      ),
      line(
        p(0, -0.28),
        p(-0.26, -0.73),
        C.ink,
        3.5
      ),
      line(
        p(0, -0.28),
        p(0.26, -0.73),
        C.ink,
        3.5
      )
    ];

    const toolbox = rect(
      0.59 * scale,
      0.37 * scale,
      p(0.58, -0.40),
      C.violet,
      0.24,
      1.7,
      0.05 * scale
    );

    const handle = new M.Arc({
      radius: 0.11 * scale,
      startAngle: 0,
      angle: Math.PI,
      color: C.violet,
      strokeWidth: 1.8
    });

    handle.moveTo(p(0.58, -0.19));

    return new M.VGroup(
      head,
      helmet,
      brim,
      torso,
      ...limbs,
      toolbox,
      handle
    );
  }

  // ------------------------------------------------------------
  // Opening: a repair team with limited investigation time.
  // ------------------------------------------------------------

  const INTRO_Y = P ? 1.60 : 0.20;

  const TEAM_X = P ? -1.95 : -3.00;

  const PUMP_X = P ? 1.70 : 3.00;

  const team = [
    workerIcon(TEAM_X - 0.44, INTRO_Y, 0.86),
    workerIcon(TEAM_X + 0.48, INTRO_Y, 0.86)
  ];

  const teamLabel = txt(
    'Repair team',
    22,
    C.ink,
    [TEAM_X, INTRO_Y - 1.00, 0]
  );

  const openingPump = pumpIcon(
    PUMP_X,
    INTRO_Y,
    1.62,
    BLUE
  );

  const pumpLabel = txt(
    'Water pump',
    22,
    BLUE,
    [PUMP_X, INTRO_Y - 1.00, 0]
  );

  const openingBell = bellIcon(
    PUMP_X + 0.82,
    INTRO_Y + 1.00,
    1.45
  );

  // 0 — Imagine a repair team that wants to catch every failure.
  await until(S(0));
  await play(
    ...ins(team),
    new M.FadeIn(teamLabel),
    new M.FadeIn(openingPump),
    new M.FadeIn(pumpLabel),
    new M.FadeIn(openingBell),
    ...say('CATCH EVERY PUMP THAT IS ABOUT TO FAIL')
  );

  function clockIcon(x, y, r) {
    const face = circle(
      r,
      [x, y, 0],
      AMBER,
      0.07,
      2.2
    );

    const ticks = [];

    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;

      ticks.push(
        line(
          [
            x + r * 0.82 * Math.cos(a),
            y + r * 0.82 * Math.sin(a),
            0
          ],
          [
            x + r * 0.96 * Math.cos(a),
            y + r * 0.96 * Math.sin(a),
            0
          ],
          AMBER,
          1.5
        )
      );
    }

    const hands = [
      line(
        [x, y, 0],
        [x, y + r * 0.55, 0],
        AMBER,
        2.3
      ),
      line(
        [x, y, 0],
        [
          x + r * 0.49,
          y - r * 0.27,
          0
        ],
        AMBER,
        2.3
      )
    ];

    return new M.VGroup(
      face,
      ...ticks,
      ...hands
    );
  }

  const timeClock = clockIcon(
    0,
    P ? -0.48 : -0.42,
    P ? 0.59 : 0.57
  );

  const limitedTime = txt(
    'Limited investigation time',
    21,
    AMBER,
    [0, P ? -1.45 : -1.33, 0],
    false,
    FW - 0.80
  );

  // 1 — Workers have limited time to investigate alerts.
  await until(S(1));
  await play(
    new M.FadeIn(timeClock),
    new M.FadeIn(limitedTime),
    ...say('WORKERS HAVE LIMITED TIME', AMBER)
  );

  const openingQuestion = txt(
    'Catch more failures without too many false alarms?',
    P ? 23 : 24,
    C.ink,
    [0, P ? -2.45 : 1.20, 0],
    false,
    FW - 1.00
  );

  // 2 — Catch more failures without wasting too much time?
  await until(S(2));
  await play(
    new M.FadeIn(openingQuestion),
    ...say('CAN WE CATCH MORE WITHOUT WASTING TIME?', C.violet)
  );

  // ------------------------------------------------------------
  // Initial twelve-pump grid.
  //
  // Introduce the cards first, predictions second, and actual
  // outcomes third.
  //
  // The grid is initially arranged by pump ID.
  // It is reorganized into probability rows at beat 11.
  // ------------------------------------------------------------

  const INITIAL_COLS = 4;

  const INITIAL_SP_X = P ? 1.72 : 2.36;

  const INITIAL_SP_Y = P ? 1.60 : 1.07;

  const INITIAL_TOP = P ? 2.08 : 0.76;

  const INITIAL_W = P ? 1.50 : 2.10;

  const INITIAL_H = P ? 1.37 : 0.90;

  function initialPosition(i) {
    const col = i % INITIAL_COLS;
    const row = Math.floor(i / INITIAL_COLS);

    return [
      (col - 1.5) * INITIAL_SP_X,
      INITIAL_TOP - row * INITIAL_SP_Y,
      0
    ];
  }

  const PROB_GROUPS = [
    [0],
    [1, 2],
    [3, 4, 5],
    [6, 7, 8, 9, 10, 11]
  ];

  const GROUP_PROBABILITIES = [90, 60, 30, 10];

  const SORTED_X0 = P ? -2.43 : -5.30;

  const SORTED_SP_X = P ? 1.06 : 0.88;

  const SORTED_TOP = P ? 2.67 : 0.95;

  const SORTED_SP_Y = P ? 0.83 : 0.73;

  const SORTED_W = P ? 0.89 : 0.76;

  const SORTED_H = P ? 0.67 : 0.58;

  const groupY = g =>
    SORTED_TOP - g * SORTED_SP_Y;

  function sortedPosition(i) {
    const group = PROB_GROUPS.findIndex(
      indices => indices.includes(i)
    );

    const j = PROB_GROUPS[group].indexOf(i);

    return [
      SORTED_X0 + j * SORTED_SP_X,
      groupY(group),
      0
    ];
  }

  function pumpCard(i, p, compact = false) {
    const x = p[0];
    const y = p[1];

    const w = compact ? SORTED_W : INITIAL_W;

    const h = compact ? SORTED_H : INITIAL_H;

    const glow = rect(
      w + 0.07,
      h + 0.07,
      p,
      BLUE,
      0.035,
      0.7,
      0.10
    );

    const bg = rect(
      w,
      h,
      p,
      C.muted,
      0,
      1.1,
      compact ? 0.07 : 0.11
    );

    bg.setFill(C.card, 0.96);

    const icon = compact
      ? pumpIcon(
          x - w * 0.21,
          y + h * 0.19,
          P ? 0.22 : 0.19,
          C.ink
        )
      : pumpIcon(
          x - w * 0.20,
          y + h * 0.15,
          P ? 0.40 : 0.35,
          C.ink
        );

    const id = txt(
      PUMPS[i],
      compact ? (P ? 15 : 14) : 22,
      C.ink,
      [
        x + w * 0.22,
        y + h * 0.22,
        0
      ],
      true,
      w * 0.43
    );

    return new M.VGroup(
      glow,
      bg,
      icon,
      id
    );
  }

  function probabilityLabel(i, p, compact = false) {
    const w = compact ? SORTED_W : INITIAL_W;
    const h = compact ? SORTED_H : INITIAL_H;

    return txt(
      `${PROBABILITIES[i]}%`,
      compact ? (P ? 13 : 12) : 24,
      BLUE,
      [
        p[0] + (compact ? 0 : w * 0.16),
        p[1] - h * (compact ? 0.035 : 0.23),
        0
      ],
      true,
      compact ? w * 0.80 : w * 0.52
    );
  }

  function cardOutcome(i, p, compact = false) {
    const w = compact ? SORTED_W : INITIAL_W;

    const h = compact ? SORTED_H : INITIAL_H;

    return outcomeSymbol(
      FAILED[i],
      p[0] - w * 0.27,
      p[1] - h * (compact ? 0.30 : 0.24),
      compact ? 0.085 : 0.125
    );
  }

  const cards = PUMPS.map((_, i) =>
    pumpCard(i, initialPosition(i))
  );

  const probabilities = PUMPS.map((_, i) =>
    probabilityLabel(i, initialPosition(i))
  );

  const outcomes = PUMPS.map((_, i) =>
    cardOutcome(i, initialPosition(i))
  );

  const gridTitle = txt(
    '12 WATER PUMPS',
    P ? 23 : 22,
    C.ink,
    [0, P ? 3.18 : 1.43, 0],
    true
  );

  // 3 — Bring back the twelve water pump cards.
  await until(S(3));
  await play(
    ...outs([
      ...team,
      teamLabel,
      openingPump,
      pumpLabel,
      openingBell,
      timeClock,
      limitedTime,
      openingQuestion
    ]),
    new M.FadeIn(gridTitle),
    lagIn(cards, 1.20, 0.075),
    ...say('OUR TWELVE WATER PUMPS')
  );

  // 4 — Pump one has a 90% predicted failure chance.
  await until(S(4));
  await play(
    new M.FadeIn(probabilities[0]),
    ...say('P1: 90% PREDICTED FAILURE CHANCE', BLUE)
  );

  // 5 — Pumps two and three each have 60%.
  await until(S(5));
  await play(
    ...ins(probabilities.slice(1, 3)),
    ...say('P2 AND P3: 60% EACH', BLUE)
  );

  // 6 — Pumps four, five and six each have 30%.
  await until(S(6));
  await play(
    ...ins(probabilities.slice(3, 6)),
    ...say('P4, P5 AND P6: 30% EACH', BLUE)
  );

  // 7 — The remaining six pumps each have 10%.
  await until(S(7));
  await play(
    lagIn(
      probabilities.slice(6),
      1.20,
      0.10
    ),
    ...say('P7 THROUGH P12: 10% EACH', BLUE)
  );

  // ------------------------------------------------------------
  // Later observed outcomes.
  //
  // Failure refers specifically to the next ten hours.
  // The ten safe pumps are not claimed never to fail.
  // ------------------------------------------------------------

  const INITIAL_LEGEND_Y = P ? -2.05 : -1.92;

  const SORTED_LEGEND_Y = P ? -0.54 : -1.74;

  function outcomeLegend(compact = false) {
    const y = compact
      ? SORTED_LEGEND_Y
      : INITIAL_LEGEND_Y;

    const cx = compact && !P ? -3.48 : 0;

    const leftX = cx - (compact ? 2.10 : 2.42);

    const rightX = cx + (compact ? 0.40 : 0.57);

    const fail = outcomeSymbol(
      true,
      leftX,
      y,
      compact ? 0.085 : 0.13
    );

    const safe = outcomeSymbol(
      false,
      rightX,
      y,
      compact ? 0.085 : 0.13
    );

    const ftext = T(
      'Failed',
      compact ? 14 : 19,
      RED
    );

    ftext.moveTo([
      leftX + 0.18 + ftext.getWidth() / 2,
      y,
      0
    ]);

    const stext = T(
      'Did not fail',
      compact ? 14 : 19,
      GREEN
    );

    stext.moveTo([
      rightX + 0.18 + stext.getWidth() / 2,
      y,
      0
    ]);

    return new M.VGroup(
      fail,
      ftext,
      safe,
      stext
    );
  }

  let legendNow = outcomeLegend();

  const failureOutlines = [1, 3].map(i =>
    rect(
      INITIAL_W + 0.08,
      INITIAL_H + 0.08,
      initialPosition(i),
      RED,
      0,
      2.5,
      0.12
    )
  );

  // 8 — Only P2 and P4 actually fail within ten hours.
  await until(S(8));
  await play(
    ...failureOutlines.map(o => new M.Create(o)),
    ...fbox([
      ['Observed over the next 10 hours', C.ink],
      ['Only P2 and P4 actually fail', RED]
    ], RED),
    ...say('REAL FAILURES: P2 AND P4', RED)
  );

  // 9 — Red diamonds for failures, green circles otherwise.
  await until(S(9));
  await play(
    ...outs(failureOutlines),
    lagIn(outcomes, 1.25, 0.08),
    new M.FadeIn(legendNow),
    ...fbox([
      ['Red diamond = failed within 10 hours', RED],
      ['Green circle = did not fail within 10 hours', GREEN]
    ]),
    ...say('MARK THE REAL OUTCOMES')
  );

  // 10 — Failures are rare in this group.
  await until(S(10));
  await play(
    new M.Indicate(outcomes[1], { color: RED }),
    new M.Indicate(outcomes[3], { color: RED }),
    ...fbox([
      ['2 failed out of 12 pumps', RED],
      ['10 did not fail', GREEN]
    ], AMBER),
    ...say('ONLY TWO OF THE TWELVE PUMPS FAIL', AMBER)
  );

  // ------------------------------------------------------------
  // Sort cards from highest to lowest predicted probability.
  //
  // The rows contain tied probabilities.
  // Each pump keeps its own identity and actual outcome.
  // Equal-score pumps always enter the alert set together.
  // ------------------------------------------------------------

  const GROUP_LABEL_X = P ? -3.37 : -6.22;

  const groupLabels = GROUP_PROBABILITIES.map(
    (v, g) =>
      txt(
        `${v}%`,
        P ? 19 : 18,
        BLUE,
        [GROUP_LABEL_X, groupY(g), 0],
        true,
        P ? 0.77 : 0.82
      )
  );

  const sortedTitle = txt(
    'HIGHEST CHANCE TO LOWEST',
    P ? 19 : 18,
    BLUE,
    [
      P ? 0 : -3.45,
      P ? 3.33 : 1.47,
      0
    ],
    true,
    P ? 6.80 : 6.20
  );

  // 11 — Arrange cards by predicted failure chance.
  await until(S(11));
  await play(
    new M.FadeOut(gridTitle),
    new M.FadeIn(sortedTitle),
    new M.LaggedStart(
      cards.map((card, i) =>
        new M.Transform(
          card,
          pumpCard(
            i,
            sortedPosition(i),
            true
          ),
          { pathArc: 0.12 }
        )
      ),
      { lagRatio: 0.045, runTime: 1.40 }
    ),
    ...probabilities.map((o, i) =>
      new M.Transform(
        o,
        probabilityLabel(
          i,
          sortedPosition(i),
          true
        )
      )
    ),
    ...outcomes.map((o, i) =>
      new M.Transform(
        o,
        cardOutcome(
          i,
          sortedPosition(i),
          true
        )
      )
    ),
    new M.Transform(
      legendNow,
      outcomeLegend(true)
    ),
    ...ins(groupLabels),
    ...dropBox(),
    ...say('SORT BY PREDICTED FAILURE CHANCE', BLUE)
  );

  // ------------------------------------------------------------
  // Sliding alert gate.
  //
  // The gate separates alerted rows above it from rows below.
  // The card layout is a sorted list, not a proportional
  // numerical probability axis.
  //
  // Moving from 90 to 60, 30 and 10 includes entire tied groups.
  // The 100% setting places the gate above all cards.
  // ------------------------------------------------------------

  const GATE_LEFT = P ? -3.05 : -5.86;

  const GATE_RIGHT = P ? 3.46 : -0.34;

  function gateY(threshold) {
    if (threshold >= 100) {
      return SORTED_TOP + SORTED_SP_Y / 2;
    }

    const g = GROUP_PROBABILITIES.indexOf(
      threshold
    );

    return groupY(g) - SORTED_SP_Y / 2;
  }

  function gatePicture(threshold) {
    const y = gateY(threshold);

    const rail = line(
      [GATE_LEFT, y, 0],
      [GATE_RIGHT, y, 0],
      AMBER,
      3.2
    );

    const glow = line(
      [GATE_LEFT, y, 0],
      [GATE_RIGHT, y, 0],
      AMBER,
      1
    );

    const handles = [
      rect(
        0.12,
        0.20,
        [GATE_LEFT, y, 0],
        AMBER,
        0.85,
        1.2,
        0.035
      ),
      rect(
        0.12,
        0.20,
        [GATE_RIGHT, y, 0],
        AMBER,
        0.85,
        1.2,
        0.035
      )
    ];

    return new M.VGroup(
      glow,
      rail,
      ...handles
    );
  }

  let gateNow = gatePicture(100);

  const GATE_STATUS_POS = P
    ? [0, 3.35, 0]
    : [-3.48, 1.49, 0];

  function gateStatus(threshold) {
    const s = threshold === null
      ? 'ALERT THRESHOLD'
      : `ALERT IF CHANCE ≥ ${threshold}%`;

    return txt(
      s,
      P ? 20 : 19,
      AMBER,
      GATE_STATUS_POS,
      true,
      P ? 6.80 : 6.20
    );
  }

  let gateStatusNow = gateStatus(null);

  let currentThreshold = 100;

  function moveGate(threshold) {
    currentThreshold = threshold;

    const nextStatus = gateStatus(threshold);

    const a = [
      new M.Transform(
        gateNow,
        gatePicture(threshold)
      ),
      new M.FadeOut(gateStatusNow),
      new M.FadeIn(nextStatus)
    ];

    gateStatusNow = nextStatus;

    return a;
  }

  // 12 — Imagine a sliding gate that admits more alerts.
  await until(S(12));
  await play(
    new M.FadeOut(sortedTitle),
    new M.FadeIn(gateStatusNow),
    new M.Create(gateNow),
    ...fbox([
      ['Lower the threshold to admit more alerts', AMBER],
      'Pumps above the gate become alerted'
    ], AMBER),
    ...say('A SLIDING GATE FOR ALERTS', AMBER)
  );

  // ------------------------------------------------------------
  // Two questions for every gate position.
  // ------------------------------------------------------------

  const QUESTION_X = P ? 0 : 3.35;

  const QUESTION_W = P ? 6.10 : 5.40;

  const QUESTION_H = P ? 1.00 : 0.89;

  const QUESTION_Y = P
    ? [-1.52, -2.84]
    : [0.60, -0.62];

  function questionCard(
    number,
    heading,
    body,
    color,
    index
  ) {
    const x = QUESTION_X;
    const y = QUESTION_Y[index];

    const bg = rect(
      QUESTION_W,
      QUESTION_H,
      [x, y, 0],
      color,
      0,
      1.8,
      0.12
    );

    bg.setFill(C.card, 0.96);

    const badge = circle(
      0.20,
      [
        x - QUESTION_W / 2 + 0.38,
        y,
        0
      ],
      color,
      0.12,
      1.5
    );

    const n = txt(
      number,
      19,
      color,
      [
        x - QUESTION_W / 2 + 0.38,
        y,
        0
      ],
      true
    );

    const head = txt(
      heading,
      P ? 21 : 21,
      color,
      [x + 0.20, y + 0.17, 0],
      false,
      QUESTION_W - 1.08
    );

    const sub = txt(
      body,
      P ? 17 : 17,
      C.ink,
      [x + 0.20, y - 0.18, 0],
      false,
      QUESTION_W - 1.08
    );

    return new M.VGroup(
      bg,
      badge,
      n,
      head,
      sub
    );
  }

  const q1 = questionCard(
    '1',
    'Question one',
    'How many alerts are correct?',
    AMBER,
    0
  );

  const q2 = questionCard(
    '2',
    'Question two',
    'How many real failures are caught?',
    GREEN,
    1
  );

  // 13 — Ask two questions for every gate position.
  await until(S(13));
  await play(
    new M.FadeIn(q1),
    new M.FadeIn(q2),
    ...dropBox(),
    ...say('TWO QUESTIONS AT EVERY THRESHOLD')
  );

  // 14 — What share of our alerts are correct?
  await until(S(14));
  await play(
    new M.Indicate(q1, { color: AMBER }),
    ...say('WHAT SHARE OF OUR ALERTS ARE CORRECT?', AMBER)
  );

  // 15 — This share is precision.
  await until(S(15));
  await play(
    new M.Transform(
      q1,
      questionCard(
        '1',
        'PRECISION',
        'Share of alerts that are correct',
        AMBER,
        0
      )
    ),
    ...say('CORRECT SHARE OF ALERTS = PRECISION', AMBER)
  );

  // 16 — What share of the real failures do we catch?
  await until(S(16));
  await play(
    new M.Indicate(q2, { color: GREEN }),
    ...say('WHAT SHARE OF REAL FAILURES DO WE CATCH?', GREEN)
  );

  // 17 — This share is recall.
  await until(S(17));
  await play(
    new M.Transform(
      q2,
      questionCard(
        '2',
        'RECALL',
        'Share of real failures that are caught',
        GREEN,
        1
      )
    ),
    ...say('CAUGHT SHARE OF FAILURES = RECALL', GREEN)
  );

  // ------------------------------------------------------------
  // Precision–recall graph.
  //
  // x = recall, from 0 to 100%.
  // y = precision, from 0 to 100%.
  //
  // The four measured points are plotted using exact fractions.
  // Approximate percentages appear only in human-readable labels.
  // ------------------------------------------------------------

  const GX0 = P ? -2.74 : 1.04;

  const GX1 = P ? 2.68 : 5.92;

  const GY0 = P ? -3.85 : -1.26;

  const GY1 = P ? -1.15 : 1.27;

  const GRAPH_W = GX1 - GX0;

  const GRAPH_H = GY1 - GY0;

  const gx = recall =>
    GX0 + recall * GRAPH_W;

  const gy = precision =>
    GY0 + precision * GRAPH_H;

  const gp = (recall, precision) => [
    gx(recall),
    gy(precision),
    0
  ];

  const xAxis = arrow(
    [GX0, GY0, 0],
    [GX1 + 0.15, GY0, 0],
    C.muted,
    2.2
  );

  const yAxis = arrow(
    [GX0, GY0, 0],
    [GX0, GY1 + 0.10, 0],
    C.muted,
    2.2
  );

  const xLabel = txt(
    'Recall — failures caught (%)',
    P ? 17 : 17,
    GREEN,
    [
      (GX0 + GX1) / 2,
      GY0 - 0.52,
      0
    ],
    false,
    GRAPH_W + 0.25
  );

  let graphTitle = txt(
    'Precision — correct alerts (%)',
    P ? 17 : 18,
    AMBER,
    [
      (GX0 + GX1) / 2,
      GY1 + 0.27,
      0
    ],
    false,
    GRAPH_W + 0.30
  );

  const GRID_VALUES = [0, 0.25, 0.5, 0.75, 1];

  const graphGrid = [];

  const graphTicks = [];

  GRID_VALUES.forEach(v => {
    const x = gx(v);
    const y = gy(v);

    if (v > 0) {
      graphGrid.push(
        new M.DashedLine({
          start: [GX0, y, 0],
          end: [GX1, y, 0],
          color: C.muted,
          strokeWidth: 0.8
        })
      );

      graphGrid.push(
        new M.DashedLine({
          start: [x, GY0, 0],
          end: [x, GY1, 0],
          color: C.muted,
          strokeWidth: 0.8
        })
      );
    }

    graphTicks.push(
      line(
        [x, GY0 - 0.06, 0],
        [x, GY0 + 0.06, 0],
        C.muted,
        1.3
      ),
      line(
        [GX0 - 0.06, y, 0],
        [GX0 + 0.06, y, 0],
        C.muted,
        1.3
      ),
      txt(
        `${Math.round(v * 100)}%`,
        P ? 15 : 14,
        C.muted,
        [x, GY0 - 0.20, 0],
        true
      ),
      txt(
        `${Math.round(v * 100)}%`,
        P ? 15 : 14,
        C.muted,
        [GX0 - 0.43, y, 0],
        true
      )
    );
  });

  // 18 — Draw recall horizontally and precision vertically.
  await until(S(18));
  await play(
    new M.FadeOut(q1),
    new M.FadeOut(q2),
    new M.FadeIn(xAxis),
    new M.FadeIn(yAxis),
    new M.FadeIn(xLabel),
    new M.FadeIn(graphTitle),
    ...say('RECALL ACROSS, PRECISION UP')
  );

  // 19 — Both axes run from zero to one hundred percent.
  await until(S(19));
  await play(
    ...graphGrid.map(o => new M.Create(o)),
    ...ins(graphTicks),
    ...say('BOTH AXES: 0% TO 100%')
  );

  // ------------------------------------------------------------
  // Alert overlays.
  //
  // Each alert consists of a bell and an outline around its card.
  // Actual outcome symbols remain unchanged beneath the alert.
  //
  // A red diamond with a bell is a caught failure.
  // A green outlined circle with a bell is a false alarm.
  // ------------------------------------------------------------

  function alertOverlay(i) {
    const p = sortedPosition(i);

    const outline = rect(
      SORTED_W + 0.045,
      SORTED_H + 0.045,
      p,
      AMBER,
      0,
      2.3,
      0.09
    );

    const bell = bellIcon(
      p[0] + SORTED_W * 0.27,
      p[1] - SORTED_H * 0.29,
      P ? 0.40 : 0.35
    );

    return new M.VGroup(
      outline,
      bell
    );
  }

  const alertOverlays = PUMPS.map((_, i) =>
    alertOverlay(i)
  );

  let activeAlerts = Array(N).fill(false);

  function updateAlerts(threshold) {
    const result = evaluate(threshold);

    const a = [];

    result.alerted.forEach((next, i) => {
      if (next && !activeAlerts[i]) {
        a.push(
          new M.FadeIn(alertOverlays[i])
        );
      }

      if (!next && activeAlerts[i]) {
        a.push(
          new M.FadeOut(alertOverlays[i])
        );
      }
    });

    activeAlerts = result.alerted.slice();

    return a;
  }

  function caughtIndices(threshold) {
    return PUMPS.map((_, i) => i).filter(
      i => PROBABILITIES[i] >= threshold && FAILED[i]
    );
  }

  function falseAlarmIndices(threshold) {
    return PUMPS.map((_, i) => i).filter(
      i => PROBABILITIES[i] >= threshold && !FAILED[i]
    );
  }

  function alertedIndices(threshold) {
    return PUMPS.map((_, i) => i).filter(
      i => PROBABILITIES[i] >= threshold
    );
  }

  // ------------------------------------------------------------
  // Graph point helpers.
  //
  // Labels identify the threshold that produced each point.
  // This makes the graph's percentages distinct from cutoffs.
  // ------------------------------------------------------------

  function prPoint(result, index) {
    const p = gp(
      result.recall,
      result.precision
    );

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.17 : 0.16,
      color: C.cyan
    });

    halo.setFill(C.cyan, 0.15);

    const dot = new M.Dot({
      point: p,
      radius: P ? 0.079 : 0.078,
      color: C.cyan
    });

    dot.setFill(C.cyan, 1);

    // Place right-edge labels inside the graph.
    // The two vertically aligned points have separate labels.

    const offsets = [
      [0.57, 0.21],
      [0, 0.23],
      [-0.54, 0.23],
      [-0.54, -0.23]
    ];

    const [dx, dy] = offsets[index];

    const label = txt(
      `${result.threshold}% cutoff`,
      P ? 15 : 14,
      C.cyan,
      [p[0] + dx, p[1] + dy, 0],
      true,
      P ? 1.26 : 1.40
    );

    return {
      group: new M.VGroup(
        halo,
        dot,
        label
      ),
      dot,
      label,
      p
    };
  }

  const points = RESULTS.map(prPoint);

  // ------------------------------------------------------------
  // Threshold 90%.
  //
  // One alert, zero caught failures.
  // ------------------------------------------------------------

  // 20 — Begin with a threshold of 90%.
  await until(S(20));
  await play(
    ...moveGate(90),
    ...fbox([
      ['Alert if predicted chance ≥ 90%', AMBER]
    ], AMBER),
    ...say('START WITH A 90% THRESHOLD', AMBER)
  );

  // 21 — Only P1 receives a bell, but it did not fail.
  await until(S(21));
  await play(
    ...updateAlerts(90),
    new M.Indicate(
      outcomes[0],
      { color: GREEN }
    ),
    ...fbox([
      ['Alerts: P1', AMBER],
      ['P1 did not actually fail', GREEN]
    ], AMBER),
    ...say('ONE ALERT: P1 DID NOT FAIL', AMBER)
  );

  // 22 — None of the alerts are correct: precision = 0%.
  await until(S(22));
  await play(
    new M.Indicate(
      alertOverlays[0],
      { color: AMBER }
    ),
    ...fbox([
      ['Caught failures: 0', RED],
      ['Precision = 0/1 = 0%', AMBER]
    ], AMBER),
    ...say('PRECISION: 0 CORRECT OUT OF 1 ALERT', AMBER)
  );

  // 23 — Neither failure is caught: recall = 0%.
  await until(S(23));
  await play(
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    new M.Indicate(
      outcomes[3],
      { color: RED }
    ),
    ...fbox([
      ['Precision = 0/1 = 0%', AMBER],
      ['Recall = 0/2 = 0%', GREEN]
    ]),
    ...say('RECALL: 0 CAUGHT OUT OF 2 FAILURES', GREEN)
  );

  // 24 — First dot at the bottom-left corner.
  await until(S(24));
  await play(
    new M.FadeIn(points[0].group),
    ...fbox([
      ['90% threshold', C.ink],
      ['Recall 0%     Precision 0%', C.cyan]
    ]),
    ...say('FIRST DOT: RECALL 0%, PRECISION 0%')
  );

  // ------------------------------------------------------------
  // Threshold 60%.
  //
  // Three alerts, one caught failure.
  // ------------------------------------------------------------

  // 25 — Lower the threshold to 60%.
  await until(S(25));
  await play(
    ...moveGate(60),
    ...fbox([
      ['Alert if predicted chance ≥ 60%', AMBER]
    ], AMBER),
    ...say('LOWER THE THRESHOLD TO 60%', AMBER)
  );

  // 26 — P2 and P3 receive bells too.
  await until(S(26));
  await play(
    ...updateAlerts(60),
    ...fbox([
      ['Alerts: P1, P2, P3', AMBER],
      ['P2 is a caught failure', RED]
    ], AMBER),
    ...say('P2 AND P3 ALSO RECEIVE BELLS', AMBER)
  );

  // 27 — One of three alerts is correct.
  await until(S(27));
  await play(
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    indicateAll(
      alertedIndices(60).map(i => alertOverlays[i]),
      AMBER
    ),
    ...fbox([
      ['Caught failures: 1', RED],
      ['Precision = 1/3 ≈ 33%', AMBER]
    ], AMBER),
    ...say('PRECISION: 1 OUT OF 3 ≈ 33%', AMBER)
  );

  // 28 — One of two failures is caught.
  await until(S(28));
  await play(
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    new M.Indicate(
      outcomes[3],
      { color: RED }
    ),
    ...fbox([
      ['Precision = 1/3 ≈ 33%', AMBER],
      ['Recall = 1/2 = 50%', GREEN]
    ]),
    ...say('RECALL: 1 OUT OF 2 = 50%', GREEN)
  );

  // ------------------------------------------------------------
  // Projection guides for a new graph point.
  //
  // Guides are introduced with the point and removed before
  // changing the threshold again.
  // ------------------------------------------------------------

  function projectionGuides(result) {
    const x = gx(result.recall);
    const y = gy(result.precision);

    const guides = [];

    if (result.recall > 0) {
      guides.push(
        new M.DashedLine({
          start: [GX0, y, 0],
          end: [x, y, 0],
          color: AMBER,
          strokeWidth: 1.8
        })
      );
    }

    if (result.precision > 0) {
      guides.push(
        new M.DashedLine({
          start: [x, GY0, 0],
          end: [x, y, 0],
          color: GREEN,
          strokeWidth: 1.8
        })
      );
    }

    return guides;
  }

  const guides60 = projectionGuides(RESULTS[1]);

  // 29 — Plot recall 50% and precision about 33%.
  await until(S(29));
  await play(
    ...guides60.map(o => new M.Create(o)),
    new M.FadeIn(points[1].group),
    ...fbox([
      ['60% threshold', C.ink],
      ['Recall 50%     Precision ≈33%', C.cyan]
    ]),
    ...say('SECOND DOT: 50% ACROSS, ABOUT 33% UP')
  );

  // ------------------------------------------------------------
  // Threshold 30%.
  //
  // Six alerts, two caught failures.
  // Precision stays exactly 1/3.
  // Recall rises to 1.
  // ------------------------------------------------------------

  // 30 — Lower the threshold to 30%.
  await until(S(30));
  await play(
    ...outs(guides60),
    ...moveGate(30),
    ...fbox([
      ['Alert if predicted chance ≥ 30%', AMBER]
    ], AMBER),
    ...say('LOWER THE THRESHOLD TO 30%', AMBER)
  );

  // 31 — P4, P5 and P6 receive bells too.
  await until(S(31));
  await play(
    ...updateAlerts(30),
    ...fbox([
      ['Alerts: P1 through P6', AMBER],
      ['P4 is now caught as well', RED]
    ], AMBER),
    ...say('P4, P5 AND P6 ALSO RECEIVE BELLS', AMBER)
  );

  // 32 — Two of six alerts are correct.
  await until(S(32));
  await play(
    ...caughtIndices(30).map(i =>
      new M.Indicate(
        outcomes[i],
        { color: RED }
      )
    ),
    ...fbox([
      ['Caught failures: 2', RED],
      ['Precision = 2/6 = 1/3 ≈ 33%', AMBER]
    ], AMBER),
    ...say('PRECISION STAYS AT ABOUT 33%', AMBER)
  );

  // 33 — Both failures are caught: recall = 100%.
  await until(S(33));
  await play(
    ...caughtIndices(30).map(i =>
      new M.Indicate(
        alertOverlays[i],
        { color: GREEN }
      )
    ),
    ...fbox([
      ['Precision = 2/6 ≈ 33%', AMBER],
      ['Recall = 2/2 = 100%', GREEN]
    ]),
    ...say('RECALL: BOTH FAILURES CAUGHT = 100%', GREEN)
  );

  const guides30 = projectionGuides(RESULTS[2]);

  const sameHeightGuide = new M.DashedLine({
    start: points[1].p,
    end: points[2].p,
    color: AMBER,
    strokeWidth: 2.2
  });

  // 34 — Next point moves right at the same height.
  await until(S(34));
  await play(
    ...guides30.map(o => new M.Create(o)),
    new M.Create(sameHeightGuide),
    new M.FadeIn(points[2].group),
    ...fbox([
      ['30% threshold', C.ink],
      ['Recall 100%     Precision ≈33%', C.cyan]
    ]),
    ...say('MORE RECALL, SAME PRECISION')
  );

  // ------------------------------------------------------------
  // Threshold 10%.
  //
  // All twelve pumps receive alerts.
  // Both real failures are caught.
  // Ten alerts are false alarms.
  // ------------------------------------------------------------

  // 35 — Lower the threshold to 10%, alerting every pump.
  await until(S(35));
  await play(
    ...outs([
      ...guides30,
      sameHeightGuide
    ]),
    ...moveGate(10),
    ...updateAlerts(10),
    ...fbox([
      ['Alert if predicted chance ≥ 10%', AMBER],
      ['All twelve pumps receive alerts', AMBER]
    ], AMBER),
    ...say('10% THRESHOLD: EVERY PUMP GETS A BELL', AMBER)
  );

  // 36 — Two out of twelve alerts are correct.
  await until(S(36));
  await play(
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    new M.Indicate(
      outcomes[3],
      { color: RED }
    ),
    ...fbox([
      ['Only 2 of the 12 alerts are correct', RED],
      ['Precision = 2/12 ≈ 17%', AMBER]
    ], AMBER),
    ...say('PRECISION FALLS TO ABOUT 17%', AMBER)
  );

  // 37 — Both failures are still caught.
  await until(S(37));
  await play(
    new M.Indicate(
      alertOverlays[1],
      { color: GREEN }
    ),
    new M.Indicate(
      alertOverlays[3],
      { color: GREEN }
    ),
    ...fbox([
      ['Precision = 2/12 ≈ 17%', AMBER],
      ['Recall = 2/2 = 100%', GREEN]
    ]),
    ...say('RECALL REMAINS AT 100%', GREEN)
  );

  const guides10 = projectionGuides(RESULTS[3]);

  const downwardGuide = arrow(
    [
      GX1 - 0.08,
      gy(RESULTS[2].precision) - 0.06,
      0
    ],
    [
      GX1 - 0.08,
      gy(RESULTS[3].precision) + 0.06,
      0
    ],
    AMBER,
    2
  );

  // 38 — Last point moves down at the right edge.
  await until(S(38));
  await play(
    ...guides10.map(o => new M.Create(o)),
    new M.FadeIn(downwardGuide),
    new M.FadeIn(points[3].group),
    ...fbox([
      ['10% threshold', C.ink],
      ['Recall 100%     Precision ≈17%', C.cyan]
    ]),
    ...say('SAME RECALL, LOWER PRECISION')
  );

  // ------------------------------------------------------------
  // Connect the four measured points in threshold order.
  //
  // Do not reorder by precision.
  // The final segment is vertical because recall is unchanged.
  // ------------------------------------------------------------

  const segments = [
    line(
      points[0].p,
      points[1].p,
      C.cyan,
      3.6
    ),
    line(
      points[1].p,
      points[2].p,
      C.cyan,
      3.6
    ),
    line(
      points[2].p,
      points[3].p,
      C.cyan,
      3.6
    )
  ];

  // 39 — Connect the dots in the order they were placed.
  await until(S(39));
  await play(
    ...outs([
      ...guides10,
      downwardGuide
    ]),
    new M.LaggedStart(
      segments.map(o => new M.Create(o)),
      {
        lagRatio: 0.22,
        runTime: 1.25
      }
    ),
    ...fbox([
      ['Threshold order: 90 → 60 → 30 → 10', C.ink]
    ]),
    ...say('JOIN THE DOTS IN THRESHOLD ORDER')
  );

  // 40 — Name the precision–recall curve.
  await until(S(40));

  const curveTitle = txt(
    'Precision–recall curve',
    P ? 21 : 22,
    C.cyan,
    [
      (GX0 + GX1) / 2,
      GY1 + 0.27,
      0
    ],
    false,
    GRAPH_W + 0.40
  );

  const precisionAxisNote = txt(
    'Precision (%)',
    P ? 15 : 13,
    AMBER,
    [
      GX0 + 0.52,
      GY1 - 0.10,
      0
    ],
    false,
    1.28
  );

  await play(
    new M.Transform(
      graphTitle,
      curveTitle
    ),
    new M.FadeIn(precisionAxisNote),
    ...say('PRECISION–RECALL CURVE')
  );

  // ------------------------------------------------------------
  // Formula recap.
  //
  // Both measures use the number of caught failures.
  // The denominators are different.
  //
  // Precision denominator: all model alerts.
  // Recall denominator: all actual failures.
  // ------------------------------------------------------------

  // 41 — Every dot comes from the same two formulas.
  await until(S(41));
  await play(
    indicateAll(
      points.map(p => p.group),
      C.cyan,
      1.45
    ),
    ...fbox([
      ['Same two measures at every threshold', C.ink],
      ['Precision and recall', C.cyan]
    ]),
    ...say('THE SAME TWO FORMULAS PRODUCE EVERY DOT')
  );

  // 42 — Precision = caught failures / total alerts.
  await until(S(42));
  await play(
    new M.Indicate(
      alertOverlays[1],
      { color: AMBER }
    ),
    new M.Indicate(
      alertOverlays[3],
      { color: AMBER }
    ),
    ...fbox([
      ['Precision = caught failures ÷ total alerts', AMBER],
      'At 10% threshold: 2/12 ≈ 17%'
    ], AMBER),
    ...say('PRECISION = CAUGHT FAILURES ÷ ALL ALERTS', AMBER)
  );

  // 43 — Recall = caught failures / total real failures.
  await until(S(43));
  await play(
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    new M.Indicate(
      outcomes[3],
      { color: RED }
    ),
    ...fbox([
      ['Recall = caught failures ÷ total real failures', GREEN],
      'At 10% threshold: 2/2 = 100%'
    ], GREEN),
    ...say('RECALL = CAUGHT FAILURES ÷ ALL REAL FAILURES', GREEN)
  );

  // ------------------------------------------------------------
  // Reference precision.
  //
  // Two of the twelve pumps failed.
  // The failure prevalence is exactly 1/6.
  //
  // Alerts selected without useful discrimination have expected
  // precision equal to the failure prevalence, provided alerts
  // are selected independently of the actual outcome.
  //
  // This is an average reference, not a guarantee for any
  // particular randomly chosen alert set.
  // ------------------------------------------------------------

  // 44 — Notice the height of the last dot, about 17%.
  await until(S(44));
  await play(
    new M.Indicate(
      points[3].group,
      { color: C.cyan }
    ),
    ...fbox([
      ['Last dot: precision = 2/12 ≈ 17%', AMBER]
    ], AMBER),
    ...say('NOTICE THE LAST DOT’S HEIGHT: ABOUT 17%', AMBER)
  );

  // 45 — This is also the share of all pumps that failed.
  await until(S(45));
  await play(
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    new M.Indicate(
      outcomes[3],
      { color: RED }
    ),
    ...fbox([
      ['2 real failures among 12 pumps', RED],
      ['Failure rate = 2/12 ≈ 17%', C.violet]
    ], C.violet),
    ...say('THE OVERALL FAILURE RATE IS ALSO ABOUT 17%', C.violet)
  );

  // ------------------------------------------------------------
  // Explain the reference with a separate small sampling picture.
  //
  // The twelve fixed outcome symbols are copied into a strip.
  // The illustration does not fabricate a random sample result.
  // ------------------------------------------------------------

  const SAMPLE_X = P ? 0 : -3.43;

  const SAMPLE_Y = P ? -0.83 : -1.45;

  function prevalenceStrip() {
    const parts = [];

    const w = P ? 6.65 : 5.78;

    const spacing = w / 12;

    for (let i = 0; i < N; i++) {
      const x =
        SAMPLE_X - w / 2 + (i + 0.5) * spacing;

      parts.push(
        outcomeSymbol(
          FAILED[i],
          x,
          SAMPLE_Y,
          P ? 0.12 : 0.105
        )
      );
    }

    return new M.VGroup(...parts);
  }

  // 46 — Uninformed alerts have this precision on average.
  await until(S(46));
  await play(
    ...fbox([
      ['Alerts chosen without useful information', C.violet],
      ['Expected precision = failure share = 2/12', C.violet],
      'About 17% on average, not every time'
    ], C.violet),
    ...say('UNINFORMED ALERTS: ABOUT 17% ON AVERAGE', C.violet)
  );

  const referenceY = gy(FAILURE_RATE);

  const referenceLine = new M.DashedLine({
    start: [GX0, referenceY, 0],
    end: [GX1, referenceY, 0],
    color: C.violet,
    strokeWidth: 2.4
  });

  const referenceLabel = txt(
    'Reference ≈17%',
    P ? 15 : 15,
    C.violet,
    [
      GX0 + GRAPH_W * 0.47,
      referenceY - 0.20,
      0
    ],
    true,
    GRAPH_W * 0.48
  );

  // 47 — Draw a horizontal reference line at 1/6.
  await until(S(47));
  await play(
    new M.Create(referenceLine),
    new M.FadeIn(referenceLabel),
    ...fbox([
      ['Reference precision = 2/12 ≈ 16.7%', C.violet],
      'Compare the curve with this horizontal line'
    ], C.violet),
    ...say('REFERENCE LINE: THE OVERALL FAILURE RATE', C.violet)
  );

  // ------------------------------------------------------------
  // Ideal region.
  //
  // High recall and high precision are both desirable.
  // The ideal corner is the upper-right corner.
  // This is a target, not an observed result for Tool A.
  // ------------------------------------------------------------

  const idealW = GRAPH_W * 0.22;

  const idealH = GRAPH_H * 0.23;

  const idealRegion = rect(
    idealW,
    idealH,
    [
      GX1 - idealW / 2,
      GY1 - idealH / 2,
      0
    ],
    GREEN,
    0.10,
    1.8,
    0.08
  );

  const idealDot = circle(
    0.09,
    [GX1, GY1, 0],
    GREEN,
    0,
    2.5
  );

  const idealLabel = txt(
    'Ideal',
    17,
    GREEN,
    [
      GX1 - idealW / 2,
      GY1 - idealH / 2,
      0
    ],
    false,
    idealW - 0.13
  );

  // 48 — Ideally, the curve is near the upper-right corner.
  await until(S(48));
  await play(
    new M.FadeIn(idealRegion),
    new M.FadeIn(idealDot),
    new M.FadeIn(idealLabel),
    ...fbox([
      ['High recall: catch most failures', GREEN],
      ['High precision: few false alarms among alerts', AMBER]
    ], GREEN),
    ...say('IDEAL: HIGH RECALL AND HIGH PRECISION', GREEN)
  );

  // 49 — Compare alert settings or tools, especially for rare failures.
  await until(S(49));
  await play(
    new M.LaggedStart(
      segments.map(o =>
        new M.Indicate(
          o,
          { color: C.cyan }
        )
      ),
      {
        lagRatio: 0.18,
        runTime: 1.50
      }
    ),
    ...fbox([
      ['Compare thresholds or prediction tools', C.cyan],
      ['Especially when real failures are rare', RED]
    ]),
    ...say('USE THE CURVE WHEN FAILURES ARE RARE')
  );

  // ------------------------------------------------------------
  // Return to the 30% threshold.
  //
  // Both failures are caught.
  // Six alerts include four false alarms.
  //
  // Highlight the six actual alerts.
  // Do not change any actual outcome marks.
  // ------------------------------------------------------------

  const selectedPoint30 = circle(
    P ? 0.16 : 0.15,
    points[2].p,
    AMBER,
    0,
    2.6
  );

  // 50 — At 30%, every actual failure is caught.
  await until(S(50));
  await play(
    ...outs([
      idealRegion,
      idealDot,
      idealLabel
    ]),
    ...moveGate(30),
    ...updateAlerts(30),
    new M.Create(selectedPoint30),
    new M.Indicate(
      outcomes[1],
      { color: RED }
    ),
    new M.Indicate(
      outcomes[3],
      { color: RED }
    ),
    ...fbox([
      ['30% threshold catches P2 and P4', GREEN],
      ['Recall = 2/2 = 100%', GREEN]
    ], GREEN),
    ...say('AT 30% WE CATCH EVERY FAILURE', GREEN)
  );

  // ------------------------------------------------------------
  // False-alarm markers.
  //
  // These are separate from both the bell and real-outcome
  // symbols. A false-alarm mark is an additional explanation
  // of an already displayed model decision.
  // ------------------------------------------------------------

  function falseAlarmMark(i) {
    const p = sortedPosition(i);

    const x = p[0] + SORTED_W * 0.33;

    const y = p[1] + SORTED_H * 0.35;

    const bg = circle(
      0.10,
      [x, y, 0],
      RED,
      0.95,
      1.3
    );

    const cross = txt(
      '×',
      15,
      C.ink,
      [x, y, 0]
    );

    return new M.VGroup(
      bg,
      cross
    );
  }

  const falseAlarmMarks30 =
    falseAlarmIndices(30).map(
      falseAlarmMark
    );

  // 51 — Four of the six alerts are false alarms.
  await until(S(51));
  await play(
    lagIn(
      falseAlarmMarks30,
      0.90,
      0.15
    ),
    ...fbox([
      ['6 alerts = 2 correct + 4 false alarms', AMBER],
      ['Precision = 2/6 ≈ 33%', AMBER],
      ['Recall = 100% does not mean perfect alerts', GREEN]
    ], AMBER),
    ...say('FOUR OF SIX ALERTS ARE FALSE ALARMS', AMBER)
  );

  // ------------------------------------------------------------
  // Threshold 100% — no alerts.
  //
  // None of the twelve pumps has a predicted chance of 100%.
  // The gate moves above every card and all bells disappear.
  //
  // There is no measured precision–recall point for this setting
  // because the precision denominator is zero.
  // ------------------------------------------------------------

  // 52 — Raising the threshold to 100% produces no alerts.
  await until(S(52));
  await play(
    ...outs(falseAlarmMarks30),
    new M.FadeOut(selectedPoint30),
    ...moveGate(100),
    ...updateAlerts(100),
    ...fbox([
      ['100% threshold', AMBER],
      ['0 alerts: no pump reaches the threshold', C.muted]
    ], AMBER),
    ...say('100% THRESHOLD: NO ALERTS AT ALL', AMBER)
  );

  // ------------------------------------------------------------
  // Undefined precision.
  //
  // Keep the previously measured curve unchanged.
  // Do not plot 0/0 at zero or one.
  // ------------------------------------------------------------

  const undefinedTag = pill(
    'NO MEASURED POINT',
    AMBER,
    P ? 15 : 16
  );

  undefinedTag.moveTo([
    gx(0.52),
    gy(0.72),
    0
  ]);

  // 53 — With no alerts, precision cannot be calculated.
  await until(S(53));
  await play(
    new M.FadeIn(undefinedTag),
    ...fbox([
      ['Precision = 0/0 = undefined', AMBER],
      ['Recall = 0/2 = 0%', GREEN],
      'No measured precision point is added'
    ], AMBER),
    ...say('NO ALERTS: PRECISION IS UNDEFINED', AMBER)
  );

  // ------------------------------------------------------------
  // Final summary.
  //
  // Restore the illustrative 30% setting.
  // Preserve all four measured precision–recall points and
  // the reference line at the observed failure rate.
  //
  // The final scene shows the trade-off directly:
  //
  // 90% threshold: recall 0%, precision 0%.
  // 60% threshold: recall 50%, precision about 33%.
  // 30% threshold: recall 100%, precision about 33%.
  // 10% threshold: recall 100%, precision about 17%.
  //
  // High recall alone does not guarantee trustworthy alerts.
  // The useful threshold depends on the practical consequences
  // of missed failures and false alarms.
  // ------------------------------------------------------------

  // 54 — The curve shows alert trustworthiness as recall increases.
  await until(S(54));
  await play(
    new M.FadeOut(undefinedTag),
    ...moveGate(30),
    ...updateAlerts(30),
    new M.FadeIn(selectedPoint30),
    new M.LaggedStart(
      segments.map(o =>
        new M.Indicate(
          o,
          { color: C.cyan }
        )
      ),
      {
        lagRatio: 0.18,
        runTime: 1.55
      }
    ),
    ...fbox([
      ['Recall: how many real failures do we catch?', GREEN],
      ['Precision: how trustworthy are our alerts?', AMBER],
      ['Compare both as the threshold changes', C.cyan]
    ]),
    ...say('CATCH MORE FAILURES. CHECK ALERT TRUSTWORTHINESS.')
  );
}
