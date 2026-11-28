// lesson 16.1.3
// Individual response curves: how does one home's prediction change?
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

  const TEST_CALLS = [0, 1, 2];

  const INDIVIDUAL_CURVES = HOMES.map((_, i) =>
    TEST_CALLS.map(n => predict(n, PIPES[i]))
  );

  const A_RISKS = INDIVIDUAL_CURVES[0];

  const GROUP_MEANS = TEST_CALLS.map(n =>
    HOMES.reduce(
      (sum, _, i) => sum + predict(n, PIPES[i]),
      0
    ) / HOMES.length
  );

  const A_CHANGES = [
    A_RISKS[1] - A_RISKS[0],
    A_RISKS[2] - A_RISKS[1]
  ];

  const GROUP_CHANGES = [
    GROUP_MEANS[1] - GROUP_MEANS[0],
    GROUP_MEANS[2] - GROUP_MEANS[1]
  ];

  // Original risks: [90, 10, 50, 30]
  //
  // Home A, older pipe: [30, 60, 90]
  // Home B, newer pipe: [10, 30, 50]
  // Home C, newer pipe: [10, 30, 50]
  // Home D, older pipe: [30, 60, 90]
  //
  // Group means: [20, 45, 70]
  //
  // Home A changes: +30, +30 percentage points.
  // Group mean changes: +25, +25 percentage points.
  //
  // All calculations use the same trained model.
  // Only hypothetical call values change.
  // No real pipe condition or inspection outcome changes.

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22
  // Content between y = -5.5 and y = 4.3.
  //
  // Laptop: 14.22 x 8
  // Content between y = -3.0 and y = 2.3.
  //
  // Phone: focused home and dial above graph.
  // Laptop: focused home and dial left of graph.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.40;

  const PILL = P
    ? [0, 3.90, 0]
    : [0, 1.95, 0];

  const EARLY_BOX = P
    ? [0, -2.45, 0]
    : [0, -2.25, 0];

  const FOCUS_BOX = P
    ? [0, -1.95, 0]
    : [3.25, -0.10, 0];

  const LATE_BOX = P
    ? [0, -5.25, 0]
    : [0, -2.50, 0];

  const FOCUS_Y = P ? 2.78 : 0.78;
  const FOCUS_W = P ? 6.65 : 5.50;
  const FOCUS_H = P ? 0.82 : 0.72;

  const STATUS_Y = P ? 3.35 : 1.38;

  const DIAL_Y = P ? 1.48 : -0.38;
  const DIAL_SP = P ? 1.65 : 1.30;

  const MODEL_Y = P ? 0.43 : -1.40;

  const CELL_FONT = P ? 20 : 20;
  const SMALL_FONT = P ? 15 : 16;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const districtColor = i =>
    DISTRICTS[i] === 'North' ? C.cyan : C.amber;

  // Home A is cyan throughout.
  // Group means are green throughout.
  // Pipe types are violet throughout.
  // Changes in predicted risk are amber.

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

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
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

  function arrow(a, b, color = C.cyan, strokeWidth = 2.5) {
    const shaft = line(a, b, color, strokeWidth);

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);

    const ux = dx / len;
    const uy = dy / len;

    const size = 0.15;

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
      shaft,
      line(left, b, color, strokeWidth),
      line(right, b, color, strokeWidth)
    );
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style.
  //
  // mode 0: initial four-home table.
  // mode 1: focused home before graph.
  // mode 2: graph visible.
  // ------------------------------------------------------------

  let boxNow = null;
  let boxMode = 0;

  function fbox(lines, color = C.cyan) {
    const compact = boxMode === 2;

    const pos = boxMode === 0
      ? EARLY_BOX
      : boxMode === 1
        ? FOCUS_BOX
        : LATE_BOX;

    const size = compact
      ? (P ? 19 : 19)
      : (P ? 22 : 21);

    const lh = compact
      ? (P ? 0.29 : 0.28)
      : (P ? 0.44 : 0.41);

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
    const padding = compact ? 0.18 : 0.36;
    const ht = rows.length * lh + padding;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: compact ? 0.12 : 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(pos);

    const left = pos[0] - wd / 2 + 0.32;
    const top = pos[1] + ht / 2 - padding / 2 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];
      const indent = cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = compact
      ? (P ? FW - 0.70 : FW - 2.10)
      : boxMode === 1
        ? (P ? FW - 0.80 : 5.80)
        : (P ? FW - 0.80 : FW - 3.0);

    const maxh = compact ? 0.86 : 2.20;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(pos);

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

  function house(x, y, name, color = C.cyan) {
    const wall = new M.Rectangle({
      width: 1.22,
      height: 1.05,
      color,
      strokeWidth: 2
    });

    wall.setFill(C.card, 0.95);
    wall.moveTo([x, y, 0]);

    const roofL = line(
      [x - 0.76, y + 0.50, 0],
      [x, y + 1.22, 0],
      color,
      3.5
    );

    const roofR = line(
      [x, y + 1.22, 0],
      [x + 0.76, y + 0.50, 0],
      color,
      3.5
    );

    const door = new M.Rectangle({
      width: 0.31,
      height: 0.51,
      color,
      strokeWidth: 1.5
    });

    door.setFill(color, 0.20);
    door.moveTo([x, y - 0.27, 0]);

    const windows = [-0.36, 0.36].map(dx => {
      const w = new M.Rectangle({
        width: 0.25,
        height: 0.25,
        color,
        strokeWidth: 1.2
      });

      w.setFill(color, 0.60);
      w.moveTo([x + dx, y + 0.16, 0]);

      return w;
    });

    const pipe = line(
      [x - 0.63, y - 0.69, 0],
      [x + 0.63, y - 0.69, 0],
      C.violet,
      5
    );

    const label = txt(
      name,
      P ? 23 : 24,
      C.ink,
      [x, y - 1.04, 0]
    );

    return new M.VGroup(
      wall,
      roofL,
      roofR,
      door,
      ...windows,
      pipe,
      label
    );
  }

  function person(x, y) {
    const head = new M.Circle({
      radius: 0.23,
      color: C.ink,
      strokeWidth: 1.5
    });

    head.setFill(C.ink, 0.92);
    head.moveTo([x, y + 0.61, 0]);

    const body = new M.Arc({
      radius: 0.46,
      startAngle: 0,
      angle: Math.PI,
      color: C.ink
    });

    body.setFill(C.ink, 0.85);
    body.moveTo([x, y + 0.05, 0]);

    const desk = rect(
      1.50,
      0.42,
      [x, y - 0.32, 0],
      C.violet,
      0.14,
      2
    );

    const screen = rect(
      0.76,
      0.47,
      [x + 0.49, y + 0.22, 0],
      C.cyan,
      0.20,
      1.8
    );

    const label = txt(
      'Dispatcher',
      P ? 20 : 21,
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

  const INTRO_Y = P ? 1.03 : 0.23;
  const INTRO_X = P ? 1.80 : 2.45;

  const dispatcher = person(-INTRO_X, INTRO_Y);
  const introHouse = house(
    INTRO_X,
    INTRO_Y,
    'Home A',
    C.cyan
  );

  const questionMark = txt(
    '?',
    40,
    C.amber,
    [0, INTRO_Y + 0.48, 0],
    true
  );

  const openingArrow = arrow(
    [-INTRO_X + 0.85, INTRO_Y - 0.05, 0],
    [INTRO_X - 0.85, INTRO_Y - 0.05, 0],
    C.amber,
    2.5
  );

  // 0 — Dispatcher asks about one particular home.
  await until(S(0));
  await play(
    new M.FadeIn(dispatcher),
    new M.FadeIn(introHouse),
    new M.FadeIn(questionMark),
    ...say('A QUESTION ABOUT ONE HOME')
  );

  // 1 — How do calls change predicted risk for this home?
  await until(S(1));
  await play(
    new M.FadeIn(openingArrow),
    ...fbox([
      ['Number of calls', C.cyan],
      ['       ↓', C.amber],
      ['Predicted risk for Home A?', C.cyan]
    ]),
    ...say('HOW DOES HOME A’S RISK RESPOND?')
  );

  // 2 — Define risk.
  await until(S(2));
  await play(
    ...fbox([
      ['Risk = estimated chance', C.cyan],
      'that a visit is urgent',
      ['Urgent = crew needed today', C.amber]
    ]),
    ...say('RISK = ESTIMATED CHANCE OF URGENCY')
  );

  // ------------------------------------------------------------
  // Four-home table.
  //
  // A, B, C and D remain in fixed row order.
  // District labels accompany their colors.
  // ------------------------------------------------------------

  const TABLE_W = P ? 6.55 : 7.00;
  const TABLE_H = P ? 0.76 : 0.62;

  const TABLE_TOP = P ? 2.18 : 0.97;
  const TABLE_STEP = P ? 0.91 : 0.76;

  const TABLE_HEADER_Y = P ? 2.95 : 1.53;

  const tableY = i =>
    TABLE_TOP - i * TABLE_STEP;

  function requestRow(
    i,
    calls,
    x,
    y,
    w = TABLE_W,
    h = TABLE_H
  ) {
    const color = districtColor(i);

    const bg = rect(
      w,
      h,
      [x, y, 0],
      C.muted,
      0,
      1,
      0.10
    );

    bg.setFill(C.card, 0.87);

    const edge = line(
      [x - w / 2 + 0.045, y - h * 0.32, 0],
      [x - w / 2 + 0.045, y + h * 0.32, 0],
      color,
      4
    );

    const homeX = x - w * 0.34;
    const callsX = x;
    const pipeX = x + w * 0.32;

    const home = txt(
      `Home ${HOMES[i]}`,
      CELL_FONT,
      C.ink,
      [homeX, y + 0.10, 0],
      false,
      w * 0.29
    );

    const district = txt(
      DISTRICTS[i],
      SMALL_FONT,
      color,
      [homeX, y - 0.16, 0],
      false,
      w * 0.27
    );

    const callBg = rect(
      w * 0.18,
      h * 0.68,
      [callsX, y, 0],
      C.cyan,
      0.12,
      1.5,
      0.09
    );

    const callText = txt(
      String(calls),
      CELL_FONT,
      C.cyan,
      [callsX, y, 0],
      true,
      w * 0.15
    );

    const pipeBg = rect(
      w * 0.23,
      h * 0.68,
      [pipeX, y, 0],
      C.violet,
      0.12,
      1.5,
      0.09
    );

    const pipeText = txt(
      PIPES[i],
      CELL_FONT,
      C.violet,
      [pipeX, y, 0],
      false,
      w * 0.20
    );

    return new M.VGroup(
      bg,
      edge,
      home,
      district,
      callBg,
      callText,
      pipeBg,
      pipeText
    );
  }

  const tableHeaders = new M.VGroup(
    txt(
      'Home',
      18,
      C.muted,
      [-TABLE_W * 0.34, TABLE_HEADER_Y, 0]
    ),
    txt(
      'Calls',
      18,
      C.cyan,
      [0, TABLE_HEADER_Y, 0]
    ),
    txt(
      'Pipe type',
      18,
      C.violet,
      [TABLE_W * 0.32, TABLE_HEADER_Y, 0]
    )
  );

  const rows = HOMES.map((_, i) =>
    requestRow(i, CALLS[i], 0, tableY(i))
  );

  // 3 — Bring back the four homes.
  await until(S(3));
  await play(
    ...outs([
      dispatcher,
      introHouse,
      questionMark,
      openingArrow
    ]),
    ...dropBox(),
    new M.FadeIn(tableHeaders),
    ...say('OUR FOUR HOMES')
  );

  // 4 — Home A: two calls, older pipe.
  await until(S(4));
  await play(
    new M.FadeIn(rows[0]),
    ...say('A: 2 CALLS, OLDER PIPE')
  );

  // 5 — Home B: zero calls, newer pipe.
  await until(S(5));
  await play(
    new M.FadeIn(rows[1]),
    ...say('B: 0 CALLS, NEWER PIPE')
  );

  // 6 — Home C: two calls, newer pipe.
  await until(S(6));
  await play(
    new M.FadeIn(rows[2]),
    ...say('C: 2 CALLS, NEWER PIPE')
  );

  // 7 — Home D: zero calls, older pipe.
  await until(S(7));
  await play(
    new M.FadeIn(rows[3]),
    ...say('D: 0 CALLS, OLDER PIPE')
  );

  // 8 — Recall the group mean from the previous lesson.
  await until(S(8));
  await play(
    ...fbox([
      ['Previous lesson: group mean', C.green],
      ['0 calls → 20%', C.green],
      ['1 call  → 45%', C.green],
      ['2 calls → 70%', C.green]
    ], C.green),
    ...say('LAST TIME: THE MEAN ACROSS FOUR HOMES', C.green)
  );

  // 9 — Does every home respond in the same way?
  await until(S(9));

  const aOutline = rect(
    TABLE_W + 0.08,
    TABLE_H + 0.08,
    [0, tableY(0), 0],
    C.cyan,
    0,
    2.5
  );

  await play(
    new M.Create(aOutline),
    ...fbox([
      ['A group mean describes the group', C.green],
      ['But what happens to Home A?', C.cyan]
    ]),
    ...say('DO ALL HOMES RESPOND THE SAME WAY?', C.amber)
  );

  // ------------------------------------------------------------
  // Focus on Home A.
  //
  // Move B, C and D aside while retaining their relative order.
  // A remains the first and only active request.
  // ------------------------------------------------------------

  const ASIDE_X = P ? 0 : 3.35;
  const ASIDE_TOP = P ? 0.90 : 0.91;
  const ASIDE_STEP = P ? 0.78 : 0.76;

  const ASIDE_W = P ? 5.40 : 5.45;
  const ASIDE_H = P ? 0.64 : 0.62;

  const asideY = i =>
    ASIDE_TOP - (i - 1) * ASIDE_STEP;

  const asideTitle = txt(
    'OTHER HOMES — SET ASIDE',
    P ? 16 : 17,
    C.muted,
    [ASIDE_X, ASIDE_TOP + 0.57, 0],
    true,
    ASIDE_W
  );

  let focusStatus = txt(
    'FOCUS: HOME A',
    17,
    C.cyan,
    [CX, STATUS_Y, 0],
    true,
    FOCUS_W
  );

  // 10 — Set the other homes aside.
  await until(S(10));

  boxMode = 1;

  await play(
    new M.FadeOut(aOutline),
    new M.FadeOut(tableHeaders),
    ...dropBox(),
    new M.Transform(
      rows[0],
      requestRow(
        0,
        CALLS[0],
        CX,
        FOCUS_Y,
        FOCUS_W,
        FOCUS_H
      ),
      { pathArc: -0.25 }
    ),
    new M.LaggedStart(
      [1, 2, 3].map(i =>
        new M.Transform(
          rows[i],
          requestRow(
            i,
            CALLS[i],
            ASIDE_X,
            asideY(i),
            ASIDE_W,
            ASIDE_H
          ),
          { pathArc: 0.25 }
        )
      ),
      { lagRatio: 0.10, runTime: 1.50 }
    ),
    new M.FadeIn(asideTitle),
    new M.FadeIn(focusStatus),
    ...say('FOCUS ON HOME A')
  );

  // ------------------------------------------------------------
  // Risk strip for Home A.
  //
  // The scale remains 0–100% at every dial position.
  // No dispatch threshold is used in this lesson.
  // ------------------------------------------------------------

  const RISK_W = P ? 3.60 : 3.20;
  const RISK_H = P ? 0.20 : 0.17;

  const RISK_X = CX;
  const RISK_Y = P ? -1.55 : -0.52;

  function riskStrip(value, x = RISK_X, y = RISK_Y) {
    const track = new M.Rectangle({
      width: RISK_W,
      height: RISK_H,
      color: C.muted,
      strokeWidth: 1
    });

    track.setFill(C.muted, 0.15);
    track.moveTo([x, y, 0]);

    const w = RISK_W * value / 100;

    const fill = new M.Rectangle({
      width: w,
      height: RISK_H,
      color: C.cyan,
      strokeWidth: 1
    });

    fill.setFill(C.cyan, 0.90);
    fill.moveTo([
      x - RISK_W / 2 + w / 2,
      y,
      0
    ]);

    const valueText = txt(
      `Predicted risk: ${value}%`,
      P ? 23 : 22,
      C.cyan,
      [x, y + 0.36, 0],
      false,
      RISK_W + 1.20
    );

    const zero = txt(
      '0%',
      15,
      C.muted,
      [x - RISK_W / 2, y - 0.24, 0],
      true
    );

    const hundred = txt(
      '100%',
      15,
      C.muted,
      [x + RISK_W / 2, y - 0.24, 0],
      true
    );

    return new M.VGroup(
      track,
      fill,
      valueText,
      zero,
      hundred
    );
  }

  let riskNow = riskStrip(ORIGINAL_RISK[0]);

  // 11 — Home A has two calls, an older pipe and 90% risk.
  await until(S(11));
  await play(
    new M.FadeIn(riskNow),
    ...say('HOME A: 2 CALLS, OLDER PIPE, 90%')
  );

  // ------------------------------------------------------------
  // A three-position call dial.
  //
  // Moving the selector changes the copied request.
  // The same model returns a new predicted risk.
  // ------------------------------------------------------------

  const dialX = n =>
    CX + (n - 1) * DIAL_SP;

  function dialFrame() {
    const parts = [];

    const rail = line(
      [dialX(0), DIAL_Y, 0],
      [dialX(2), DIAL_Y, 0],
      C.muted,
      3
    );

    parts.push(rail);

    for (const n of TEST_CALLS) {
      const socket = new M.Circle({
        radius: P ? 0.24 : 0.20,
        color: C.cyan,
        strokeWidth: 2
      });

      socket.setFill(C.card, 1);
      socket.moveTo([dialX(n), DIAL_Y, 0]);

      const value = txt(
        String(n),
        P ? 20 : 19,
        C.ink,
        [dialX(n), DIAL_Y, 0],
        true
      );

      parts.push(socket, value);
    }

    const title = txt(
      'NUMBER OF CALLS',
      P ? 17 : 17,
      C.cyan,
      [CX, DIAL_Y + 0.54, 0],
      false,
      FOCUS_W
    );

    parts.push(title);

    return new M.VGroup(...parts);
  }

  function dialSelector(n) {
    const x = dialX(n);

    const ring = new M.Circle({
      radius: P ? 0.34 : 0.29,
      color: C.amber,
      strokeWidth: 3
    });

    ring.setFill(C.amber, 0.07);
    ring.moveTo([x, DIAL_Y, 0]);

    const pointer = arrow(
      [x, DIAL_Y - 0.55, 0],
      [x, DIAL_Y - 0.33, 0],
      C.amber,
      2.5
    );

    return new M.VGroup(ring, pointer);
  }

  const dial = dialFrame();

  let selector = dialSelector(2);

  const dialIntro = rect(
    P ? 4.90 : 4.05,
    P ? 0.92 : 0.80,
    [CX, DIAL_Y, 0],
    C.cyan,
    0.05,
    1.5,
    0.14
  );

  // 12 — Imagine a dial that changes call numbers.
  await until(S(12));
  await play(
    ...outs([
      rows[1],
      rows[2],
      rows[3],
      asideTitle,
      riskNow
    ]),
    new M.FadeIn(dialIntro),
    ...fbox([
      ['A dial for the number of calls', C.cyan],
      'Try different values for Home A'
    ]),
    ...say('A DIAL TO CHANGE THE CALL NUMBER')
  );

  riskNow = null;

  // 13 — Three dial positions: zero, one and two.
  await until(S(13));
  await play(
    new M.FadeOut(dialIntro),
    new M.FadeIn(dial),
    new M.FadeIn(selector),
    ...say('THREE POSITIONS: 0, 1, 2')
  );

  // ------------------------------------------------------------
  // Model prediction card.
  //
  // Before a new prediction, show an empty prediction slot.
  // Reveal the new value only at its narrated sentence.
  // ------------------------------------------------------------

  const MODEL_W = P ? 4.75 : 4.90;
  const MODEL_H = P ? 0.72 : 0.60;

  function modelOutput(value) {
    const bg = rect(
      MODEL_W,
      MODEL_H,
      [CX, MODEL_Y, 0],
      C.violet,
      0,
      1.8,
      0.13
    );

    bg.setFill(C.card, 0.96);

    const title = txt(
      'SAME MODEL',
      P ? 17 : 17,
      C.violet,
      [CX - MODEL_W * 0.26, MODEL_Y, 0],
      true,
      MODEL_W * 0.43
    );

    const divider = line(
      [CX - 0.10, MODEL_Y - MODEL_H * 0.32, 0],
      [CX - 0.10, MODEL_Y + MODEL_H * 0.32, 0],
      C.muted,
      1
    );

    const result = txt(
      value === null ? 'Risk: ?' : `Risk: ${value}%`,
      P ? 23 : 22,
      value === null ? C.muted : C.cyan,
      [CX + MODEL_W * 0.25, MODEL_Y, 0],
      true,
      MODEL_W * 0.43
    );

    return new M.VGroup(
      bg,
      title,
      divider,
      result
    );
  }

  let modelNow = modelOutput(null);

  const modelLink = arrow(
    [CX, DIAL_Y - 0.62, 0],
    [CX, MODEL_Y + MODEL_H / 2 + 0.06, 0],
    C.violet,
    2
  );

  // 14 — Connect the dial to the trained model.
  await until(S(14));
  await play(
    new M.FadeIn(modelLink),
    new M.FadeIn(modelNow),
    ...say('CONNECT THE DIAL TO THE MODEL', C.violet)
  );

  // 15 — Every dial position gives a prediction.
  await until(S(15));
  await play(
    new M.Transform(
      modelNow,
      modelOutput(ORIGINAL_RISK[0])
    ),
    ...fbox([
      ['Turn the dial', C.cyan],
      ['Ask the same model', C.violet],
      ['Read the predicted risk', C.cyan]
    ]),
    ...say('EACH CALL VALUE GIVES A PREDICTION')
  );

  function changeStatus(s, color = C.cyan) {
    const next = txt(
      s,
      17,
      color,
      [CX, STATUS_Y, 0],
      true,
      FOCUS_W
    );

    const a = [
      new M.FadeOut(focusStatus),
      new M.FadeIn(next)
    ];

    focusStatus = next;

    return a;
  }

  // 16 — Only edit a copy of Home A's request.
  await until(S(16));
  await play(
    ...changeStatus('COPY OF HOME A’S REQUEST', C.violet),
    ...fbox([
      ['Original request remains unchanged', C.muted],
      ['Only the copied calls are edited', C.cyan]
    ], C.violet),
    ...say('CHANGE THE COPY, NOT THE REAL HOME', C.violet)
  );

  const focusPipeX = CX + FOCUS_W * 0.32;

  const pipeOutline = rect(
    FOCUS_W * 0.23 + 0.14,
    FOCUS_H * 0.68 + 0.14,
    [focusPipeX, FOCUS_Y, 0],
    C.violet,
    0,
    2.3,
    0.10
  );

  // 17 — Keep Home A's older pipe throughout.
  await until(S(17));
  await play(
    new M.Create(pipeOutline),
    ...fbox([
      ['Calls: allowed to change', C.cyan],
      ['Older pipe: stays fixed', C.violet]
    ], C.violet),
    ...say('HOME A KEEPS ITS OLDER PIPE', C.green)
  );

  function setCalls(n) {
    return [
      new M.Transform(
        selector,
        dialSelector(n),
        { pathArc: 0 }
      ),
      new M.Transform(
        rows[0],
        requestRow(
          0,
          n,
          CX,
          FOCUS_Y,
          FOCUS_W,
          FOCUS_H
        )
      ),
      new M.Transform(
        modelNow,
        modelOutput(null)
      )
    ];
  }

  function revealPrediction(value) {
    return new M.Transform(
      modelNow,
      modelOutput(value)
    );
  }

  // ------------------------------------------------------------
  // Test 1: Home A with zero calls.
  // ------------------------------------------------------------

  // 18 — Turn the dial to zero.
  await until(S(18));
  await play(
    ...setCalls(0),
    ...fbox([
      ['Home A: 0 calls', C.cyan],
      ['Older pipe unchanged', C.violet]
    ]),
    ...say('TURN THE DIAL TO 0 CALLS')
  );

  // 19 — The model returns 30%.
  await until(S(19));
  await play(
    revealPrediction(A_RISKS[0]),
    ...fbox([
      ['0 calls + older pipe', C.violet],
      ['Predicted risk = 30%', C.cyan]
    ]),
    ...say('HOME A: PREDICTED RISK = 30%')
  );

  // ------------------------------------------------------------
  // Individual response graph.
  //
  // Horizontal axis: number of calls.
  // Vertical axis: predicted risk, 0–100%.
  //
  // Home A: cyan solid line and filled circular points.
  // Group mean: green dashed line and outlined circular points.
  // ------------------------------------------------------------

  const GX0 = P ? -2.45 : 0.95;
  const GX1 = P ? 2.95 : 6.00;

  const GY0 = P ? -4.15 : -1.35;
  const GY1 = P ? -1.35 : 0.55;

  const GRAPH_W = GX1 - GX0;
  const GRAPH_H = GY1 - GY0;

  const gx = calls =>
    GX0 + calls / 2 * GRAPH_W;

  const gy = risk =>
    GY0 + risk / 100 * GRAPH_H;

  const gp = (calls, risk) =>
    [gx(calls), gy(risk), 0];

  function graphAxes() {
    const parts = [];

    for (const v of [0, 25, 50, 75, 100]) {
      const y = gy(v);

      if (v !== 0) {
        const grid = new M.DashedLine({
          start: [GX0, y, 0],
          end: [GX1, y, 0],
          color: C.muted,
          strokeWidth: 1
        });

        parts.push(grid);
      }

      parts.push(
        line(
          [GX0 - 0.07, y, 0],
          [GX0 + 0.07, y, 0],
          C.muted,
          1.5
        )
      );
    }

    for (const n of TEST_CALLS) {
      const x = gx(n);

      parts.push(
        line(
          [x, GY0 - 0.07, 0],
          [x, GY0 + 0.07, 0],
          C.muted,
          1.5
        )
      );
    }

    parts.push(
      line(
        [GX0, GY0, 0],
        [GX1 + 0.12, GY0, 0],
        C.muted,
        2.5
      ),
      line(
        [GX0, GY0, 0],
        [GX0, GY1 + 0.08, 0],
        C.muted,
        2.5
      )
    );

    return new M.VGroup(...parts);
  }

  const axes = graphAxes();

  const xTicks = TEST_CALLS.map(n =>
    txt(
      String(n),
      P ? 17 : 17,
      C.ink,
      [gx(n), GY0 - 0.20, 0],
      true
    )
  );

  const yTicks = [0, 25, 50, 75, 100].map(v =>
    txt(
      `${v}%`,
      P ? 15 : 15,
      C.muted,
      [GX0 - 0.44, gy(v), 0],
      true
    )
  );

  const xLabel = txt(
    'Number of calls',
    P ? 18 : 18,
    C.ink,
    [(GX0 + GX1) / 2, GY0 - 0.47, 0]
  );

  // Axis name stays for the whole graph; the chart title above it changes.
  const yLabel = txt(
    'Predicted risk (%)',
    P ? 17 : 17,
    C.ink,
    [(GX0 + GX1) / 2, GY1 + 0.28, 0],
    false,
    GRAPH_W
  );

  const TITLE_Y = GY1 + 0.62;
  let chartTitle = null;

  function setTitle(s, color) {
    const next = txt(
      s,
      P ? 20 : 21,
      color,
      [(GX0 + GX1) / 2, TITLE_Y, 0],
      false,
      GRAPH_W + 0.35
    );

    const a = [new M.FadeIn(next)];

    if (chartTitle) {
      a.push(new M.FadeOut(chartTitle));
    }

    chartTitle = next;

    return a;
  }

  function graphPoint(
    calls,
    value,
    color = C.cyan,
    groupMean = false,
    withLabel = true
  ) {
    const p = gp(calls, value);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.18 : 0.17,
      color
    });

    halo.setFill(color, 0.12);

    const dot = new M.Circle({
      radius: P ? 0.087 : 0.083,
      color,
      strokeWidth: 2.4
    });

    dot.setFill(
      groupMean ? C.card : color,
      1
    );

    dot.moveTo(p);

    const parts = [halo, dot];

    let label = null;

    if (withLabel) {
      const offsetX = calls === 0
        ? 0.34
        : calls === 2
          ? -0.34
          : 0;

      const offsetY = groupMean
        ? -0.24
        : 0.24;

      label = txt(
        `${value}%`,
        P ? 18 : 18,
        color,
        [
          p[0] + offsetX,
          p[1] + offsetY,
          0
        ],
        true
      );

      parts.push(label);
    }

    return {
      group: new M.VGroup(...parts),
      dot,
      label
    };
  }

  const aPoints = A_RISKS.map((v, i) =>
    graphPoint(i, v, C.cyan)
  );

  // 20 — Introduce the graph.
  await until(S(20));

  boxMode = 2;

  await play(
    new M.FadeIn(axes),
    ...fbox([
      ['Plot Home A’s predictions', C.cyan]
    ]),
    ...say('PUT THE PREDICTION ON A GRAPH')
  );

  // 21 — Number of calls along the bottom.
  await until(S(21));
  await play(
    ...ins(xTicks),
    new M.FadeIn(xLabel),
    ...say('ACROSS: NUMBER OF CALLS')
  );

  // 22 — Predicted risk up the side.
  await until(S(22));
  await play(
    ...ins(yTicks),
    new M.FadeIn(yLabel),
    ...say('UP: PREDICTED RISK')
  );

  // 23 — First dot: zero calls, 30%.
  await until(S(23));

  const firstGuide = new M.DashedLine({
    start: [GX0, gy(A_RISKS[0]), 0],
    end: [GX0 + 0.55, gy(A_RISKS[0]), 0],
    color: C.cyan,
    strokeWidth: 1.5
  });

  await play(
    new M.Create(firstGuide),
    new M.FadeIn(aPoints[0].group),
    ...fbox([
      ['Home A: 0 calls → 30%', C.cyan]
    ]),
    ...say('FIRST DOT: 0 CALLS, 30%')
  );

  // ------------------------------------------------------------
  // Test 2: Home A with one call.
  // ------------------------------------------------------------

  // 24 — Move the dial to one.
  await until(S(24));
  await play(
    new M.FadeOut(firstGuide),
    ...setCalls(1),
    ...fbox([
      ['Home A: 1 call', C.cyan],
      ['Older pipe unchanged', C.violet]
    ]),
    ...say('TURN THE DIAL TO 1 CALL')
  );

  // 25 — The model returns 60%.
  await until(S(25));
  await play(
    revealPrediction(A_RISKS[1]),
    ...fbox([
      ['1 call + older pipe → 60%', C.cyan]
    ]),
    ...say('HOME A: PREDICTED RISK = 60%')
  );

  // 26 — Second dot: one call, 60%.
  await until(S(26));
  await play(
    new M.FadeIn(aPoints[1].group),
    ...fbox([
      ['Home A: 1 call → 60%', C.cyan]
    ]),
    ...say('SECOND DOT: 1 CALL, 60%')
  );

  // ------------------------------------------------------------
  // Rise brackets.
  //
  // Each bracket measures a vertical difference in predictions.
  // The bracket is not a prediction at a new call value.
  // ------------------------------------------------------------

  function riseBracket(
    x,
    low,
    high,
    label,
    color = C.amber,
    side = 1
  ) {
    const bottom = gy(low);
    const top = gy(high);

    const vertical = line(
      [x, bottom, 0],
      [x, top, 0],
      color,
      2.4
    );

    const tick1 = line(
      [x - 0.08, bottom, 0],
      [x + 0.08, bottom, 0],
      color,
      2
    );

    const tick2 = line(
      [x - 0.08, top, 0],
      [x + 0.08, top, 0],
      color,
      2
    );

    const t = txt(
      label,
      P ? 17 : 17,
      color,
      [
        x + side * 0.38,
        (bottom + top) / 2,
        0
      ],
      true,
      0.65
    );

    return new M.VGroup(
      vertical,
      tick1,
      tick2,
      t
    );
  }

  const riseA1 = riseBracket(
    gx(1) - 0.68,
    A_RISKS[0],
    A_RISKS[1],
    '+30',
    C.amber,
    -1
  );

  const riseA2 = riseBracket(
    gx(2) - 0.70,
    A_RISKS[1],
    A_RISKS[2],
    '+30',
    C.amber,
    -1
  );

  // 27 — First rise: 30 percentage points.
  await until(S(27));
  await play(
    new M.FadeIn(riseA1),
    ...fbox([
      ['30% → 60%', C.cyan],
      ['Increase: 30 percentage points', C.amber]
    ], C.amber),
    ...say('THE RISK RISES BY 30 PERCENTAGE POINTS', C.amber)
  );

  // ------------------------------------------------------------
  // Test 3: Home A with two calls.
  // ------------------------------------------------------------

  // 28 — Move the dial to two.
  await until(S(28));
  await play(
    new M.FadeOut(riseA1),
    ...setCalls(2),
    ...fbox([
      ['Home A: 2 calls', C.cyan],
      ['Older pipe unchanged', C.violet]
    ]),
    ...say('TURN THE DIAL TO 2 CALLS')
  );

  // 29 — The model returns 90%.
  await until(S(29));
  await play(
    revealPrediction(A_RISKS[2]),
    ...fbox([
      ['2 calls + older pipe → 90%', C.cyan]
    ]),
    ...say('HOME A: PREDICTED RISK = 90%')
  );

  // 30 — Third dot: two calls, 90%.
  await until(S(30));
  await play(
    new M.FadeIn(aPoints[2].group),
    ...fbox([
      ['Home A: 2 calls → 90%', C.cyan]
    ]),
    ...say('THIRD DOT: 2 CALLS, 90%')
  );

  // 31 — Another rise of 30 percentage points.
  await until(S(31));
  await play(
    new M.FadeIn(riseA2),
    ...fbox([
      ['60% → 90%', C.cyan],
      ['Increase: 30 percentage points', C.amber]
    ], C.amber),
    ...say('ANOTHER 30-PERCENTAGE-POINT RISE', C.amber)
  );

  // ------------------------------------------------------------
  // Join Home A's predictions into an individual response curve.
  // ------------------------------------------------------------

  const aSegments = [
    line(
      gp(0, A_RISKS[0]),
      gp(1, A_RISKS[1]),
      C.cyan,
      3.5
    ),
    line(
      gp(1, A_RISKS[1]),
      gp(2, A_RISKS[2]),
      C.cyan,
      3.5
    )
  ];

  // 32 — Join the three dots.
  await until(S(32));
  await play(
    new M.FadeOut(riseA2),
    new M.LaggedStart(
      aSegments.map(s => new M.Create(s)),
      { lagRatio: 0.20, runTime: 1.05 }
    ),
    ...fbox([
      ['30% → 60% → 90%', C.cyan]
    ]),
    ...say('JOIN HOME A’S THREE PREDICTIONS')
  );

  // 33 — The line shows Home A's model response.
  await until(S(33));
  await play(
    new M.LaggedStart(
      aPoints.map(p =>
        new M.Indicate(p.group, { color: C.cyan })
      ),
      { lagRatio: 0.16, runTime: 1.65 }
    ),
    ...fbox([
      ['One home', C.cyan],
      'Different hypothetical call values'
    ]),
    ...say('HOW THE MODEL RESPONDS FOR HOME A')
  );

  // 34 — Name the individual response curve.
  await until(S(34));

  await play(
    ...setTitle('Individual response curve', C.cyan),
    ...say('INDIVIDUAL RESPONSE CURVE')
  );

  // 35 — Individual means one home.
  await until(S(35));
  await play(
    new M.Indicate(rows[0], { color: C.cyan }),
    ...fbox([
      ['Individual = one home', C.cyan],
      'Not the mean of a whole group'
    ]),
    ...say('INDIVIDUAL = ONE HOME')
  );

  // 36 — A curve connects predictions.
  await until(S(36));
  await play(
    new M.LaggedStart(
      aSegments.map(s =>
        new M.Indicate(s, { color: C.cyan })
      ),
      { lagRatio: 0.18, runTime: 1.25 }
    ),
    ...fbox([
      ['Curve = line connecting predictions', C.cyan]
    ]),
    ...say('CURVE = THE CONNECTED PREDICTIONS')
  );

  // ------------------------------------------------------------
  // Compare Home A with the group's partial dependence curve.
  //
  // Both curves share exactly the same axes.
  // Solid cyan: Home A.
  // Dashed green: mean of Homes A, B, C and D.
  // ------------------------------------------------------------

  const groupPoints = GROUP_MEANS.map((v, i) =>
    graphPoint(i, v, C.green, true)
  );

  const groupSegments = [
    new M.DashedLine({
      start: gp(0, GROUP_MEANS[0]),
      end: gp(1, GROUP_MEANS[1]),
      color: C.green,
      strokeWidth: 3
    }),
    new M.DashedLine({
      start: gp(1, GROUP_MEANS[1]),
      end: gp(2, GROUP_MEANS[2]),
      color: C.green,
      strokeWidth: 3
    })
  ];

  const LEGEND_Y = GY1 + 0.95;

  function legendItem(
    label,
    color,
    x,
    y,
    dashed = false
  ) {
    const symbol = dashed
      ? new M.DashedLine({
          start: [x - 0.25, y, 0],
          end: [x + 0.25, y, 0],
          color,
          strokeWidth: 3
        })
      : line(
          [x - 0.25, y, 0],
          [x + 0.25, y, 0],
          color,
          3
        );

    const t = T(label, P ? 15 : 16, color);

    t.moveTo([
      x + 0.35 + t.getWidth() / 2,
      y,
      0
    ]);

    return new M.VGroup(symbol, t);
  }

  const legendA = legendItem(
    'Home A',
    C.cyan,
    P ? -2.58 : 1.02,
    LEGEND_Y
  );

  const legendGroup = legendItem(
    'Four-home mean',
    C.green,
    P ? 0.20 : 3.44,
    LEGEND_Y,
    true
  );

  // 37 — Bring back the group partial dependence curve.
  await until(S(37));
  await play(
    ...setTitle('Individual and group predictions', C.ink),
    new M.FadeIn(legendA),
    new M.FadeIn(legendGroup),
    new M.LaggedStart(
      groupSegments.map(s => new M.Create(s)),
      { lagRatio: 0.17, runTime: 1.35 }
    ),
    ...fbox([
      ['Cyan: individual response', C.cyan],
      ['Green: partial dependence', C.green]
    ]),
    ...say('BRING BACK THE GROUP MEAN CURVE', C.green)
  );

  // 38 — This is the mean across all four homes.
  await until(S(38));
  await play(
    new M.Indicate(legendGroup, { color: C.green }),
    ...fbox([
      ['At each call value:', C.green],
      'Average the predictions for A, B, C and D'
    ], C.green),
    ...say('THE GREEN CURVE AVERAGES FOUR HOMES', C.green)
  );

  // 39 — Group mean at zero calls: 20%.
  await until(S(39));
  await play(
    new M.FadeIn(groupPoints[0].group),
    ...fbox([
      ['0 calls', C.ink],
      ['Home A: 30%   Group mean: 20%', C.green]
    ], C.green),
    ...say('GROUP MEAN AT 0 CALLS = 20%', C.green)
  );

  // 40 — Group mean at one call: 45%.
  await until(S(40));
  await play(
    new M.FadeIn(groupPoints[1].group),
    ...fbox([
      ['1 call', C.ink],
      ['Home A: 60%   Group mean: 45%', C.green]
    ], C.green),
    ...say('GROUP MEAN AT 1 CALL = 45%', C.green)
  );

  // 41 — Group mean at two calls: 70%.
  await until(S(41));
  await play(
    new M.FadeIn(groupPoints[2].group),
    ...fbox([
      ['2 calls', C.ink],
      ['Home A: 90%   Group mean: 70%', C.green]
    ], C.green),
    ...say('GROUP MEAN AT 2 CALLS = 70%', C.green)
  );

  // ------------------------------------------------------------
  // Compare the vertical rise for the same one-call increase.
  //
  // The first interval is used for the narrated calculation.
  // Horizontal offsets separate the two measurement brackets.
  // ------------------------------------------------------------

  const COMP_A_X = gx(0) + GRAPH_W * 0.22;
  const COMP_G_X = gx(0) + GRAPH_W * 0.38;

  const compareRiseA = riseBracket(
    COMP_A_X,
    A_RISKS[0],
    A_RISKS[1],
    '+30',
    C.cyan,
    -1
  );

  const compareRiseGroup = riseBracket(
    COMP_G_X,
    GROUP_MEANS[0],
    GROUP_MEANS[1],
    '+25',
    C.green,
    1
  );

  const comparisonGuides = [
    new M.DashedLine({
      start: gp(0, A_RISKS[0]),
      end: [COMP_A_X, gy(A_RISKS[0]), 0],
      color: C.cyan,
      strokeWidth: 1.2
    }),
    new M.DashedLine({
      start: [COMP_A_X, gy(A_RISKS[1]), 0],
      end: gp(1, A_RISKS[1]),
      color: C.cyan,
      strokeWidth: 1.2
    }),
    new M.DashedLine({
      start: gp(0, GROUP_MEANS[0]),
      end: [COMP_G_X, gy(GROUP_MEANS[0]), 0],
      color: C.green,
      strokeWidth: 1.2
    }),
    new M.DashedLine({
      start: [COMP_G_X, gy(GROUP_MEANS[1]), 0],
      end: gp(1, GROUP_MEANS[1]),
      color: C.green,
      strokeWidth: 1.2
    })
  ];

  // 42 — Compare the rise when adding one call.
  await until(S(42));

  const oneCallArrow = arrow(
    [gx(0) + 0.12, GY0 + 0.16, 0],
    [gx(1) - 0.12, GY0 + 0.16, 0],
    C.amber,
    2
  );

  const oneCallLabel = txt(
    '+1 call',
    P ? 15 : 15,
    C.amber,
    [(gx(0) + gx(1)) / 2, GY0 + 0.37, 0],
    true
  );

  await play(
    new M.FadeIn(oneCallArrow),
    new M.FadeIn(oneCallLabel),
    ...fbox([
      ['Compare the same change: 0 → 1 call', C.amber]
    ], C.amber),
    ...say('HOW MUCH DOES EACH CURVE RISE?', C.amber)
  );

  // 43 — Introduce a short formula.
  await until(S(43));
  await play(
    ...fbox([
      ['Measure the vertical change', C.amber],
      'Compare the new and previous predictions'
    ], C.amber),
    ...say('A SHORT FORMULA FOR THE CHANGE', C.amber)
  );

  // 44 — New predicted risk minus previous predicted risk.
  await until(S(44));
  await play(
    ...fbox([
      ['Change in predicted risk', C.amber],
      '= new risk − previous risk'
    ], C.amber),
    ...say('CHANGE = NEW RISK − PREVIOUS RISK', C.amber)
  );

  // 45 — Home A: 60 − 30 = 30 percentage points.
  await until(S(45));
  await play(
    new M.Create(comparisonGuides[0]),
    new M.Create(comparisonGuides[1]),
    new M.FadeIn(compareRiseA),
    ...fbox([
      ['Home A: 60% − 30%', C.cyan],
      ['= 30 percentage points', C.amber]
    ]),
    ...say('HOME A RISES BY 30 POINTS', C.cyan)
  );

  // 46 — Group: 45 − 20 = 25 percentage points.
  await until(S(46));
  await play(
    new M.Create(comparisonGuides[2]),
    new M.Create(comparisonGuides[3]),
    new M.FadeIn(compareRiseGroup),
    ...fbox([
      ['Group mean: 45% − 20%', C.green],
      ['= 25 percentage points', C.amber]
    ], C.green),
    ...say('THE GROUP MEAN RISES BY 25 POINTS', C.green)
  );

  // ------------------------------------------------------------
  // Compact comparison of the two changes.
  // ------------------------------------------------------------

  function changeBadge(label, value, color, p) {
    const w = P ? 2.90 : 2.40;
    const h = P ? 0.72 : 0.64;

    const bg = rect(
      w,
      h,
      p,
      color,
      0,
      1.6,
      0.11
    );

    bg.setFill(C.card, 0.96);

    const head = txt(
      label,
      P ? 15 : 15,
      color,
      [p[0], p[1] + 0.16, 0],
      false,
      w - 0.15
    );

    const valueText = txt(
      `+${value} points`,
      P ? 20 : 18,
      color,
      [p[0], p[1] - 0.15, 0],
      true,
      w - 0.15
    );

    return new M.VGroup(
      bg,
      head,
      valueText
    );
  }

  // 47 — Home A rises more with each extra call.
  await until(S(47));
  await play(
    new M.Indicate(compareRiseA, { color: C.cyan }),
    new M.Indicate(compareRiseGroup, { color: C.green }),
    ...fbox([
      ['Home A: +30 points per extra call', C.cyan],
      ['Group:  +25 points per extra call', C.green]
    ], C.amber),
    ...say('HOME A’S CURVE RISES MORE STEEPLY', C.amber)
  );

  // 48 — A group mean does not describe every home exactly.
  await until(S(48));
  await play(
    ...outs([
      compareRiseA,
      compareRiseGroup,
      ...comparisonGuides,
      oneCallArrow,
      oneCallLabel
    ]),
    ...fbox([
      ['The mean describes the group', C.green],
      ['Not every individual response', C.cyan]
    ]),
    ...say('THE MEAN CAN HIDE INDIVIDUAL DIFFERENCES', C.violet)
  );

  // 49 — Individual response curves explain one home's response.
  await until(S(49));
  await play(
    new M.LaggedStart(
      aPoints.map(p =>
        new M.Indicate(p.group, { color: C.cyan })
      ),
      { lagRatio: 0.18, runTime: 1.50 }
    ),
    ...fbox([
      ['Follow one home across feature values', C.cyan],
      'See how its own prediction changes'
    ]),
    ...say('UNDERSTAND ONE PARTICULAR HOME')
  );

  // ------------------------------------------------------------
  // Additional individual curves.
  //
  // A and D both have older pipes, so their curves coincide.
  // B and C both have newer pipes, so their curves coincide.
  //
  // This comparison is derived from the supplied model table.
  // Coincident curves are labeled explicitly, not offset.
  // ------------------------------------------------------------

  const newerRisks = INDIVIDUAL_CURVES[1];

  const newerPoints = newerRisks.map((v, i) =>
    graphPoint(
      i,
      v,
      C.violet,
      true,
      false
    )
  );

  const newerSegments = [
    line(
      gp(0, newerRisks[0]),
      gp(1, newerRisks[1]),
      C.violet,
      3
    ),
    line(
      gp(1, newerRisks[1]),
      gp(2, newerRisks[2]),
      C.violet,
      3
    )
  ];

  const olderHomesLabel = txt(
    'A and D',
    P ? 17 : 17,
    C.cyan,
    [
      gx(2) - 0.58,
      gy(A_RISKS[2]) - 0.30,
      0
    ],
    false,
    1.35
  );

  const newerHomesLabel = txt(
    'B and C',
    P ? 17 : 17,
    C.violet,
    [
      gx(2) - 0.57,
      gy(newerRisks[2]) - 0.26,
      0
    ],
    false,
    1.35
  );

  // 50 — Compare individual curves for every home.
  await until(S(50));
  await play(
    new M.LaggedStart(
      newerSegments.map(s => new M.Create(s)),
      { lagRatio: 0.14, runTime: 1.10 }
    ),
    ...ins(newerPoints.map(p => p.group)),
    new M.FadeIn(olderHomesLabel),
    new M.FadeIn(newerHomesLabel),
    ...fbox([
      ['A and D: older pipe — same curve', C.cyan],
      ['B and C: newer pipe — same curve', C.violet]
    ], C.violet),
    ...say('COMPARE INDIVIDUAL RESPONSE CURVES', C.violet)
  );

  // ------------------------------------------------------------
  // Limitations: model response is not a causal effect.
  //
  // Return to the focused Home A picture.
  // Changing the recorded number of calls leaves the real home
  // and its pipe condition unchanged.
  // ------------------------------------------------------------

  // 51 — Curves describe predictions, not real water problems.
  await until(S(51));
  await play(
    ...outs([
      ...newerSegments,
      ...newerPoints.map(p => p.group),
      olderHomesLabel,
      newerHomesLabel
    ]),
    ...changeStatus('HYPOTHETICAL COPY OF HOME A', C.amber),
    ...fbox([
      ['These curves show model predictions', C.cyan],
      ['Not changes in real water problems', C.amber]
    ], C.amber),
    ...say('MODEL RESPONSE DOES NOT PROVE CAUSATION', C.amber)
  );

  // 52 — Editing calls does not change the condition of the pipe.
  await until(S(52));

  const fixedPipeNote = txt(
    'PIPE TYPE UNCHANGED',
    P ? 15 : 15,
    C.violet,
    [
      CX,
      P ? FOCUS_Y - FOCUS_H / 2 - 0.16
        : FOCUS_Y - FOCUS_H / 2 - 0.15,
      0
    ],
    true,
    FOCUS_W
  );

  await play(
    new M.Indicate(pipeOutline, { color: C.violet }),
    new M.FadeIn(fixedPipeNote),
    ...fbox([
      ['Edit the recorded call number', C.cyan],
      ['The real pipe condition does not change', C.amber]
    ], C.amber),
    ...say('CHANGING THE COPY DOES NOT CHANGE THE PIPE', C.amber)
  );

  // ------------------------------------------------------------
  // Final summary.
  //
  // Keep only Home A's curve in the final graph.
  // The last image links the three dial positions to the three
  // predicted risks while the pipe stays fixed.
  // ------------------------------------------------------------

  const finalLegend = legendItem(
    'Home A — older pipe',
    C.cyan,
    P ? -1.67 : 1.68,
    LEGEND_Y
  );

  // 53 — One home's prediction as one feature changes.
  await until(S(53));
  await play(
    ...outs([
      ...groupSegments,
      ...groupPoints.map(p => p.group),
      legendA,
      legendGroup,
      fixedPipeNote
    ]),
    ...setTitle('Individual response curve', C.cyan),
    new M.FadeIn(finalLegend),
    ...changeStatus('COPY: CHANGE CALLS, KEEP PIPE'),
    new M.LaggedStart(
      aPoints.map(p =>
        new M.Indicate(p.group, { color: C.cyan })
      ),
      { lagRatio: 0.18, runTime: 1.65 }
    ),
    ...fbox([
      ['One home. Change one feature.', C.cyan],
      ['Keep the others fixed. Plot its predictions.', C.violet]
    ]),
    ...say('ONE HOME, ONE CHANGING FEATURE')
  );
}
