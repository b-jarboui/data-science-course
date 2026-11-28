// lesson 16.1.5
// Explanations and causation: explaining predictions is not explaining causes.
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

  const A_ORIGINAL = {
    home: 'A',
    district: 'North',
    calls: CALLS[0],
    pipe: PIPES[0],
    urgent: ACTUAL[0],
    risk: ORIGINAL_RISK[0]
  };

  const A_COPY = {
    ...A_ORIGINAL,
    calls: 0,
    risk: predict(0, A_ORIGINAL.pipe)
  };

  const RISK_DROP = A_ORIGINAL.risk - A_COPY.risk;

  // Checked facts:
  //
  // Home A originally has:
  //   2 calls, older pipe, 90% predicted risk.
  //   A crew confirms that its visit really is urgent.
  //
  // Hypothetical copy:
  //   0 calls, older pipe, 30% predicted risk.
  //
  // Predicted risk drop:
  //   90% − 30% = 60 percentage points.
  //
  // The hidden leak causes both repeat calls and urgent need.
  // Changing a copied record does not change the physical leak.
  //
  // Repairing the leak is a separate real-world intervention.
  // The supplied model does not estimate the causal effect
  // of repairing the leak.
  //
  // No post-repair risk or reduction in actual urgency is assumed.

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
    ? [0, -4.45, 0]
    : [0, -2.43, 0];

  const CALL_COLOR = C.cyan;
  const PIPE_COLOR = C.violet;
  const RISK_COLOR = C.cyan;
  const LEAK_COLOR = C.cyan;
  const URGENT_COLOR = C.amber;
  const REPAIR_COLOR = C.green;
  const RED = C.red || '#FF647C';

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const districtColor = i =>
    DISTRICTS[i] === 'North' ? C.cyan : C.amber;

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

  function arrow(a, b, color = C.cyan, strokeWidth = 2.5) {
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
    const lh = P ? 0.43 : 0.30;
    const padding = P ? 0.36 : 0.20;

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

    const maxw = P ? FW - 0.70 : FW - 2.0;
    const maxh = P ? 1.70 : 1.0;

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
  // Reusable visual elements.
  // ------------------------------------------------------------

  function riskStrip(value, x, y, w, color = RISK_COLOR) {
    const h = P ? 0.17 : 0.14;

    const track = solidRect(
      w,
      h,
      [x, y, 0],
      C.muted,
      0.16
    );

    const valueText = txt(
      value === null ? 'Risk: ?' : `Risk: ${value}%`,
      P ? 22 : 21,
      value === null ? C.muted : color,
      [x, y + 0.30, 0],
      true,
      w + 0.30
    );

    const zero = txt(
      '0%',
      15,
      C.muted,
      [x - w / 2, y - 0.22, 0],
      true
    );

    const hundred = txt(
      '100%',
      15,
      C.muted,
      [x + w / 2, y - 0.21, 0],
      true
    );

    const parts = [
      track,
      valueText,
      zero,
      hundred
    ];

    if (value !== null && value > 0) {
      const bw = w * value / 100;

      parts.push(
        solidRect(
          bw,
          h,
          [x - w / 2 + bw / 2, y, 0],
          color,
          0.90
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function smallCard(label, value, x, y, w, color) {
    const h = P ? 0.70 : 0.57;

    const bg = rect(
      w, h, [x, y, 0],
      color, 0.12, 1.6, 0.10
    );

    const head = txt(
      label,
      15,
      color,
      [x, y + h * 0.23, 0],
      false,
      w - 0.12
    );

    const val = txt(
      value,
      P ? 23 : 21,
      color,
      [x, y - h * 0.17, 0],
      true,
      w - 0.12
    );

    return new M.VGroup(bg, head, val);
  }

  function urgencyMark(x, y, text = 'CONFIRMED URGENT') {
    const w = P ? 3.20 : 3.40;
    const h = P ? 0.60 : 0.48;

    const bg = rect(
      w, h, [x, y, 0],
      URGENT_COLOR,
      0.12,
      1.7,
      0.11
    );

    const symbol = txt(
      '!',
      25,
      URGENT_COLOR,
      [x - w * 0.39, y, 0],
      true
    );

    const label = txt(
      text,
      P ? 17 : 17,
      URGENT_COLOR,
      [x + 0.10, y, 0],
      false,
      w - 0.62
    );

    return new M.VGroup(bg, symbol, label);
  }

  function person(x, y, color = C.ink, scale = 1) {
    const head = new M.Circle({
      radius: 0.20 * scale,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 0.90);
    head.moveTo([x, y + 0.56 * scale, 0]);

    const torso = line(
      [x, y + 0.32 * scale, 0],
      [x, y - 0.25 * scale, 0],
      color,
      4
    );

    const arms = [
      line(
        [x, y + 0.22 * scale, 0],
        [x - 0.32 * scale, y - 0.06 * scale, 0],
        color,
        3.5
      ),
      line(
        [x, y + 0.22 * scale, 0],
        [x + 0.32 * scale, y - 0.06 * scale, 0],
        color,
        3.5
      )
    ];

    const legs = [
      line(
        [x, y - 0.25 * scale, 0],
        [x - 0.24 * scale, y - 0.70 * scale, 0],
        color,
        3.5
      ),
      line(
        [x, y - 0.25 * scale, 0],
        [x + 0.24 * scale, y - 0.70 * scale, 0],
        color,
        3.5
      )
    ];

    return new M.VGroup(
      head, torso, ...arms, ...legs
    );
  }

  function callIcon(x, y, number, scale = 1) {
    const w = 0.60 * scale;
    const h = 0.96 * scale;

    const phone = rect(
      w, h, [x, y, 0],
      CALL_COLOR,
      0,
      2.1,
      0.10 * scale
    );

    phone.setFill(C.card, 0.96);

    const screen = rect(
      w * 0.78,
      h * 0.66,
      [x, y + 0.05 * scale, 0],
      CALL_COLOR,
      0.13,
      1,
      0.06
    );

    const n = txt(
      String(number),
      23 * scale,
      CALL_COLOR,
      [x, y + 0.05 * scale, 0],
      true,
      w * 0.65
    );

    const button = new M.Dot({
      point: [x, y - h * 0.38, 0],
      radius: 0.036 * scale,
      color: CALL_COLOR
    });

    const waveOne = new M.Arc({
      radius: 0.22 * scale,
      startAngle: -Math.PI / 3,
      angle: 2 * Math.PI / 3,
      color: CALL_COLOR,
      strokeWidth: 2
    });

    waveOne.moveTo([
      x + w / 2 + 0.13 * scale,
      y + 0.22 * scale,
      0
    ]);

    const waveTwo = new M.Arc({
      radius: 0.35 * scale,
      startAngle: -Math.PI / 3,
      angle: 2 * Math.PI / 3,
      color: CALL_COLOR,
      strokeWidth: 2
    });

    waveTwo.moveTo([
      x + w / 2 + 0.29 * scale,
      y + 0.22 * scale,
      0
    ]);

    return new M.VGroup(
      phone,
      screen,
      n,
      button,
      waveOne,
      waveTwo
    );
  }

  function waterDrop(x, y, size = 0.10) {
    const body = new M.Circle({
      radius: size,
      color: LEAK_COLOR,
      strokeWidth: 1
    });

    body.setFill(LEAK_COLOR, 0.82);
    body.moveTo([x, y - size * 0.14, 0]);

    const tip = [
      x,
      y + size * 1.42,
      0
    ];

    const sides = [
      line(
        [x - size * 0.68, y, 0],
        tip,
        LEAK_COLOR,
        2
      ),
      line(
        [x + size * 0.68, y, 0],
        tip,
        LEAK_COLOR,
        2
      )
    ];

    return new M.VGroup(body, ...sides);
  }

  // ------------------------------------------------------------
  // Opening: a manager considers urgent visits.
  // ------------------------------------------------------------

  const INTRO_X = P ? 1.80 : 2.65;
  const INTRO_Y = P ? 1.35 : 0.30;

  const manager = person(
    -INTRO_X,
    INTRO_Y,
    C.ink,
    1.25
  );

  const managerLabel = txt(
    'Manager',
    22,
    C.ink,
    [-INTRO_X, INTRO_Y - 1.18, 0]
  );

  function visitBoard(x, y) {
    const w = P ? 2.55 : 3.40;
    const h = P ? 2.15 : 1.85;

    const bg = rect(
      w, h, [x, y, 0],
      URGENT_COLOR, 0, 2, 0.14
    );

    bg.setFill(C.card, 0.94);

    const title = txt(
      'URGENT VISITS',
      20,
      URGENT_COLOR,
      [x, y + h * 0.34, 0],
      true,
      w - 0.24
    );

    const marks = [];

    for (let i = 0; i < 3; i++) {
      const ry = y + 0.20 - i * 0.39;

      marks.push(
        rect(
          0.24,
          0.24,
          [x - w * 0.34, ry, 0],
          URGENT_COLOR,
          0.12,
          1.4,
          0.04
        ),
        line(
          [x - w * 0.17, ry, 0],
          [x + w * 0.34, ry, 0],
          C.muted,
          2.5
        )
      );
    }

    return new M.VGroup(bg, title, ...marks);
  }

  const board = visitBoard(
    INTRO_X,
    INTRO_Y
  );

  const managerQuestion = txt(
    'Fewer urgent visits?',
    P ? 24 : 25,
    C.amber,
    [0, P ? -0.65 : -1.25, 0],
    false,
    FW - 0.8
  );

  // 0 — A manager wants to reduce urgent visits.
  await until(S(0));
  await play(
    new M.FadeIn(manager),
    new M.FadeIn(managerLabel),
    new M.FadeIn(board),
    new M.FadeIn(managerQuestion),
    ...say('CAN WE REDUCE THE NEED FOR URGENT VISITS?')
  );

  // ------------------------------------------------------------
  // Original four-home picture.
  //
  // Homes remain in fixed A, B, C, D order.
  // District names accompany their colors.
  // Risk strips share a common 0–100% scale.
  // ------------------------------------------------------------

  const TABLE_W = P ? 6.85 : 8.50;
  const TABLE_H = P ? 0.77 : 0.55;
  const TABLE_TOP = P ? 2.15 : 0.70;
  const TABLE_STEP = P ? 0.92 : 0.66;
  const TABLE_HEAD_Y = P ? 2.93 : 1.28;

  const tableY = i =>
    TABLE_TOP - i * TABLE_STEP;

  const TABLE_COL = [
    -TABLE_W * 0.35,
    -TABLE_W * 0.10,
    TABLE_W * 0.10,
    TABLE_W * 0.34
  ];

  const tableHeaders = new M.VGroup(
    txt(
      'Home',
      17,
      C.muted,
      [TABLE_COL[0], TABLE_HEAD_Y, 0]
    ),
    txt(
      'Calls',
      17,
      CALL_COLOR,
      [TABLE_COL[1], TABLE_HEAD_Y, 0]
    ),
    txt(
      'Pipe',
      17,
      PIPE_COLOR,
      [TABLE_COL[2], TABLE_HEAD_Y, 0]
    ),
    txt(
      'Predicted risk',
      17,
      RISK_COLOR,
      [TABLE_COL[3], TABLE_HEAD_Y + 0.10, 0],
      false,
      TABLE_W * 0.28
    ),
    txt(
      '0',
      12,
      C.muted,
      [
        TABLE_COL[3] - TABLE_W * 0.105,
        TABLE_HEAD_Y - 0.16,
        0
      ],
      true
    ),
    txt(
      '100%',
      12,
      C.muted,
      [
        TABLE_COL[3] + TABLE_W * 0.105,
        TABLE_HEAD_Y - 0.16,
        0
      ],
      true
    )
  );

  function homeRow(i) {
    const y = tableY(i);

    const bg = rect(
      TABLE_W,
      TABLE_H,
      [0, y, 0],
      C.muted,
      0,
      0.8,
      0.09
    );

    bg.setFill(C.card, i % 2 === 0 ? 0.85 : 0.60);

    const edge = line(
      [
        -TABLE_W / 2 + 0.04,
        y - TABLE_H * 0.30,
        0
      ],
      [
        -TABLE_W / 2 + 0.04,
        y + TABLE_H * 0.30,
        0
      ],
      districtColor(i),
      4
    );

    const home = txt(
      `Home ${HOMES[i]}`,
      19,
      C.ink,
      [TABLE_COL[0], y + 0.10, 0],
      false,
      TABLE_W * 0.23
    );

    const district = txt(
      DISTRICTS[i],
      13,
      districtColor(i),
      [TABLE_COL[0], y - 0.15, 0]
    );

    const calls = txt(
      CALLS[i],
      23,
      CALL_COLOR,
      [TABLE_COL[1], y, 0],
      true
    );

    const pipe = txt(
      PIPES[i],
      19,
      PIPE_COLOR,
      [TABLE_COL[2], y, 0],
      false,
      TABLE_W * 0.20
    );

    const w = TABLE_W * 0.21;
    const h = P ? 0.12 : 0.10;
    const x = TABLE_COL[3];
    const by = y - 0.13;

    const track = solidRect(
      w, h,
      [x, by, 0],
      C.muted,
      0.16
    );

    const bw = w * ORIGINAL_RISK[i] / 100;

    const fill = solidRect(
      bw, h,
      [x - w / 2 + bw / 2, by, 0],
      RISK_COLOR,
      0.90
    );

    const value = txt(
      `${ORIGINAL_RISK[i]}%`,
      20,
      RISK_COLOR,
      [x, y + 0.10, 0],
      true
    );

    return new M.VGroup(
      bg, edge, home, district,
      calls, pipe, track, fill, value
    );
  }

  const homeRows = HOMES.map((_, i) => homeRow(i));

  // 1 — More calls often accompany higher predicted risk.
  await until(S(1));
  await play(
    ...outs([
      manager,
      managerLabel,
      board,
      managerQuestion
    ]),
    new M.FadeIn(tableHeaders),
    lagIn(homeRows, 1.35, 0.12),
    ...fbox([
      ['More calls often accompany higher predicted risk', CALL_COLOR]
    ]),
    ...say('MORE CALLS, OFTEN HIGHER PREDICTED RISK')
  );

  // 2 — Would reducing calls reduce the need for urgent visits?
  await until(S(2));

  const questionLink = txt(
    'Fewer calls → fewer urgent visits?',
    P ? 23 : 24,
    URGENT_COLOR,
    [0, P ? -2.05 : -1.62, 0],
    false,
    FW - 0.90
  );

  await play(
    new M.FadeIn(questionLink),
    ...fbox([
      ['A question about the real world', URGENT_COLOR],
      'Not just a question about the model'
    ], URGENT_COLOR),
    ...say('WOULD FEWER CALLS MEAN FEWER URGENT VISITS?', URGENT_COLOR)
  );

  // ------------------------------------------------------------
  // Request card for Home A.
  // ------------------------------------------------------------

  function requestCard(
    title,
    calls,
    risk,
    x,
    y,
    w,
    h,
    color = CALL_COLOR,
    actualVisible = false
  ) {
    const bg = rect(
      w, h, [x, y, 0],
      color, 0, 1.8, 0.16
    );

    bg.setFill(C.card, 0.96);

    const titleText = txt(
      title,
      P ? 21 : 22,
      color,
      [x, y + h * 0.38, 0],
      false,
      w - 0.24
    );

    const callW = w * 0.39;
    const pipeW = w * 0.45;

    const callsCard = smallCard(
      'Calls',
      calls === null ? '?' : String(calls),
      x - w * 0.235,
      y + h * 0.13,
      callW,
      CALL_COLOR
    );

    const pipeCard = smallCard(
      'Pipe type',
      calls === null ? '?' : A_ORIGINAL.pipe,
      x + w * 0.22,
      y + h * 0.13,
      pipeW,
      PIPE_COLOR
    );

    const riskGroup = riskStrip(
      risk,
      x,
      y - h * 0.20,
      w * 0.76
    );

    const parts = [
      bg,
      titleText,
      callsCard,
      pipeCard,
      riskGroup
    ];

    let actualText = null;

    if (actualVisible) {
      actualText = txt(
        'Crew: urgent',
        P ? 17 : 16,
        URGENT_COLOR,
        [x, y - h * 0.41, 0],
        false,
        w - 0.25
      );

      parts.push(actualText);
    }

    return {
      group: new M.VGroup(...parts),
      callsCard,
      pipeCard,
      riskGroup,
      actualText
    };
  }

  const MAIN_W = P ? 4.50 : 5.05;
  const MAIN_H = P ? 2.75 : 2.25;
  const MAIN_Y = P ? 1.10 : -0.05;

  let mainCard = requestCard(
    'Home A — North',
    null,
    null,
    0,
    MAIN_Y,
    MAIN_W,
    MAIN_H
  );

  function replaceCard(oldCard, nextCard) {
    return [
      new M.FadeOut(oldCard.group),
      new M.FadeIn(nextCard.group)
    ];
  }

  // 3 — Focus on Home A.
  await until(S(3));
  await play(
    ...outs([
      ...homeRows,
      tableHeaders,
      questionLink
    ]),
    new M.FadeIn(mainCard.group),
    ...dropBox(),
    ...say('FOCUS ON HOME A')
  );

  // 4 — A has two calls and an older pipe.
  await until(S(4));

  const mainInputs = requestCard(
    'Home A — North',
    A_ORIGINAL.calls,
    null,
    0,
    MAIN_Y,
    MAIN_W,
    MAIN_H
  );

  await play(
    ...replaceCard(mainCard, mainInputs),
    ...say('HOME A: 2 CALLS, OLDER PIPE')
  );

  mainCard = mainInputs;

  // 5 — Home A's predicted risk is 90%.
  await until(S(5));

  const mainPrediction = requestCard(
    'Home A — North',
    A_ORIGINAL.calls,
    A_ORIGINAL.risk,
    0,
    MAIN_Y,
    MAIN_W,
    MAIN_H
  );

  await play(
    ...replaceCard(mainCard, mainPrediction),
    ...fbox([
      ['Model prediction: 90%', RISK_COLOR],
      'Estimated chance of an urgent visit'
    ]),
    ...say('HOME A’S PREDICTED RISK = 90%')
  );

  mainCard = mainPrediction;

  // 6 — Inspection confirms that the visit really is urgent.
  await until(S(6));

  const inspectedCard = requestCard(
    'Home A — North',
    A_ORIGINAL.calls,
    A_ORIGINAL.risk,
    0,
    MAIN_Y,
    MAIN_W,
    MAIN_H,
    CALL_COLOR,
    true
  );

  await play(
    ...replaceCard(mainCard, inspectedCard),
    ...fbox([
      ['Model prediction: 90%', RISK_COLOR],
      ['Crew finding: really urgent', URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('THE CREW CONFIRMS AN URGENT VISIT', URGENT_COLOR)
  );

  mainCard = inspectedCard;

  // ------------------------------------------------------------
  // Physical cutaway of Home A.
  //
  // Keep the home structure, escaping water, existing damage
  // and repair components as separate objects.
  //
  // A successful repair removes the active leak and escaping
  // water, but does not instantly undo existing water damage.
  // ------------------------------------------------------------

  function physicalHome(x, y, scale = 1) {
    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const wallW = 2.65 * scale;
    const wallH = 1.47 * scale;

    const walls = new M.Rectangle({
      width: wallW,
      height: wallH,
      color: C.ink,
      strokeWidth: 2
    });

    walls.setFill(C.card, 0.90);
    walls.moveTo(p(0, 0.14));

    const roof = [
      line(
        p(-1.55, 0.83),
        p(0, 1.73),
        C.ink,
        3.3
      ),
      line(
        p(0, 1.73),
        p(1.55, 0.83),
        C.ink,
        3.3
      )
    ];

    const door = rect(
      0.52 * scale,
      0.88 * scale,
      p(-0.68, -0.13),
      C.muted,
      0.12,
      1.5,
      0.05
    );

    const window = rect(
      0.68 * scale,
      0.56 * scale,
      p(0.64, 0.36),
      C.ink,
      0.12,
      1.5,
      0.05
    );

    const windowBars = [
      line(
        p(0.30, 0.36),
        p(0.98, 0.36),
        C.muted,
        1.3
      ),
      line(
        p(0.64, 0.08),
        p(0.64, 0.64),
        C.muted,
        1.3
      )
    ];

    const floor = solidRect(
      3.12 * scale,
      0.14 * scale,
      p(0, -0.65),
      C.muted,
      0.78
    );

    const underground = rect(
      3.12 * scale,
      0.92 * scale,
      p(0, -1.19),
      C.muted,
      0.08,
      1.1,
      0.08
    );

    const pipeLeft = line(
      p(-1.44, -1.20),
      p(-0.18, -1.20),
      PIPE_COLOR,
      7
    );

    const pipeRight = line(
      p(0.18, -1.20),
      p(1.44, -1.20),
      PIPE_COLOR,
      7
    );

    const houseLabel = txt(
      'HOME A — NORTH',
      18,
      C.ink,
      p(0, 2.00),
      true,
      3.55 * scale
    );

    const pipeLabel = txt(
      'Older pipe',
      17,
      PIPE_COLOR,
      p(-1.00, -1.86),
      false,
      1.50
    );

    const base = new M.VGroup(
      underground,
      walls,
      ...roof,
      door,
      window,
      ...windowBars,
      floor,
      pipeLeft,
      pipeRight,
      houseLabel,
      pipeLabel
    );

    // Leaking section of the pipe.

    const crackedPipe = [
      line(
        p(-0.18, -1.20),
        p(-0.07, -1.15),
        PIPE_COLOR,
        6
      ),
      line(
        p(0.07, -1.25),
        p(0.18, -1.20),
        PIPE_COLOR,
        6
      )
    ];

    const leakHalo = new M.Dot({
      point: p(0, -1.18),
      radius: 0.23 * scale,
      color: LEAK_COLOR
    });

    leakHalo.setFill(LEAK_COLOR, 0.15);

    const leakLabel = txt(
      'Hidden leak',
      17,
      LEAK_COLOR,
      p(1.00, -1.86),
      false,
      1.50
    );

    const leak = new M.VGroup(
      ...crackedPipe,
      leakHalo,
      leakLabel
    );

    // Water currently escaping from the pipe.

    const spray = [
      line(
        p(0, -1.18),
        p(-0.22, -0.94),
        LEAK_COLOR,
        2.3
      ),
      line(
        p(0, -1.18),
        p(0.05, -0.82),
        LEAK_COLOR,
        2.3
      ),
      line(
        p(0, -1.18),
        p(0.30, -0.99),
        LEAK_COLOR,
        2.3
      )
    ];

    const drops = [
      waterDrop(
        x - 0.24 * scale,
        y - 0.88 * scale,
        0.065 * scale
      ),
      waterDrop(
        x + 0.22 * scale,
        y - 0.76 * scale,
        0.075 * scale
      ),
      waterDrop(
        x + 0.06 * scale,
        y - 0.42 * scale,
        0.080 * scale
      )
    ];

    const activeWater = new M.VGroup(
      ...spray,
      ...drops
    );

    // Existing water damage above the floor.

    const dampPatch = rect(
      1.82 * scale,
      0.34 * scale,
      p(0.27, -0.45),
      LEAK_COLOR,
      0.20,
      1.2,
      0.07
    );

    const damageLines = [
      line(
        p(-0.37, -0.30),
        p(-0.22, -0.17),
        LEAK_COLOR,
        1.5
      ),
      line(
        p(0.22, -0.30),
        p(0.38, -0.14),
        LEAK_COLOR,
        1.5
      ),
      line(
        p(0.70, -0.30),
        p(0.84, -0.18),
        LEAK_COLOR,
        1.5
      )
    ];

    const damageLabel = txt(
      'Water damage',
      17,
      LEAK_COLOR,
      p(2.40, -0.40),
      false,
      1.70
    );

    const damage = new M.VGroup(
      dampPatch,
      ...damageLines,
      damageLabel
    );

    // Replacement section used only after the successful repair.

    const sealedPipe = line(
      p(-0.22, -1.20),
      p(0.22, -1.20),
      REPAIR_COLOR,
      8
    );

    const repairRing = new M.Circle({
      radius: 0.20 * scale,
      color: REPAIR_COLOR,
      strokeWidth: 2
    });

    repairRing.setFill(REPAIR_COLOR, 0.08);
    repairRing.moveTo(p(0, -1.20));

    const repairLabel = txt(
      'Leak sealed',
      17,
      REPAIR_COLOR,
      p(1.00, -1.86),
      false,
      1.50
    );

    const sealed = new M.VGroup(
      sealedPipe,
      repairRing,
      repairLabel
    );

    return {
      base,
      leak,
      activeWater,
      damage,
      sealed,
      drops,
      leakHalo
    };
  }

  const PHYSICAL_X = P ? 0 : -2.70;
  const PHYSICAL_Y = P ? 0.60 : -0.28;
  const PHYSICAL_SCALE = P ? 1.08 : 0.78;

  const home = physicalHome(
    PHYSICAL_X,
    PHYSICAL_Y,
    PHYSICAL_SCALE
  );

  const realWorldTag = pill(
    'THE REAL HOME',
    C.ink,
    17
  );

  // laptop: beside the house name (above it there is no room under the top pill)
  realWorldTag.moveTo([
    P ? PHYSICAL_X : PHYSICAL_X - 2.75,
    P ? 3.12 : PHYSICAL_Y + 2.0 * PHYSICAL_SCALE,
    0
  ]);

  // 7 — Imagine a hidden leak under Home A's floor.
  await until(S(7));
  await play(
    new M.FadeOut(mainCard.group),
    new M.FadeIn(realWorldTag),
    new M.FadeIn(home.base),
    new M.FadeIn(home.leak),
    ...fbox([
      ['Imagine a hidden leak', LEAK_COLOR],
      'Water is escaping from the older pipe'
    ]),
    ...say('A HIDDEN LEAK UNDER THE FLOOR')
  );

  // 8 — Escaping water begins to damage the home.
  await until(S(8));
  await play(
    new M.FadeIn(home.activeWater),
    new M.FadeIn(home.damage),
    new M.Flash(
      home.leakHalo,
      { color: LEAK_COLOR }
    ),
    ...fbox([
      ['Leak → escaping water → damage', LEAK_COLOR]
    ]),
    ...say('THE LEAK BEGINS TO DAMAGE THE HOME')
  );

  // ------------------------------------------------------------
  // The resident's two calls.
  //
  // Show the calls as separate events caused by the continuing
  // water problem.
  // ------------------------------------------------------------

  const CALL_AREA_X = P ? 0 : 2.72;
  const CALL_AREA_Y = P ? -2.20 : 0.35;

  const resident = person(
    CALL_AREA_X - (P ? 1.62 : 1.20),
    CALL_AREA_Y,
    C.ink,
    P ? 0.82 : 0.90
  );

  const callOne = callIcon(
    CALL_AREA_X + (P ? -0.10 : 0.10),
    CALL_AREA_Y,
    1,
    0.90
  );

  const callTwo = callIcon(
    CALL_AREA_X + (P ? 1.20 : 1.40),
    CALL_AREA_Y,
    2,
    0.90
  );

  const callOneLabel = txt(
    'First call',
    16,
    CALL_COLOR,
    [
      CALL_AREA_X + (P ? -0.10 : 0.10),
      CALL_AREA_Y - 0.70,
      0
    ]
  );

  const callTwoLabel = txt(
    'Second call',
    16,
    CALL_COLOR,
    [
      CALL_AREA_X + (P ? 1.20 : 1.40),
      CALL_AREA_Y - 0.70,
      0
    ]
  );

  // 9 — The resident notices the problem and calls.
  await until(S(9));
  await play(
    new M.FadeIn(resident),
    new M.FadeIn(callOne),
    new M.FadeIn(callOneLabel),
    ...fbox([
      ['The resident notices the water problem', C.ink],
      ['One call to the water company', CALL_COLOR]
    ]),
    ...say('THE WATER PROBLEM LEADS TO A CALL')
  );

  // 10 — The problem continues, so the resident calls again.
  await until(S(10));
  await play(
    new M.FadeIn(callTwo),
    new M.FadeIn(callTwoLabel),
    new M.Flash(
      home.leakHalo,
      { color: LEAK_COLOR }
    ),
    ...fbox([
      ['The leak continues', LEAK_COLOR],
      ['The resident makes a second call', CALL_COLOR]
    ]),
    ...say('THE PROBLEM CONTINUES: A SECOND CALL')
  );

  // ------------------------------------------------------------
  // Causal picture.
  //
  //                 Hidden leak
  //                  /       \
  //                 ↓         ↓
  //             Two calls   Urgent need
  //
  // Arrows represent real causal relationships in this
  // imagined example, not model prediction links.
  // No causal arrow is drawn from calls to urgent need.
  // ------------------------------------------------------------

  const CAUSE_POS = P
    ? [0, 1.72, 0]
    : [0, 0.08, 0];

  const CALL_EFFECT_POS = P
    ? [-2.02, -0.80, 0]
    : [-4.15, 0.08, 0];

  const URGENT_EFFECT_POS = P
    ? [2.02, -0.80, 0]
    : [4.15, 0.08, 0];

  const CAUSE_W = P ? 3.0 : 3.0;
  const CAUSE_H = P ? 1.43 : 1.30;

  const EFFECT_W = P ? 3.15 : 3.00;
  const EFFECT_H = P ? 1.65 : 1.40;

  function causalNode(
    title,
    subtitle,
    p,
    w,
    h,
    color
  ) {
    const bg = rect(
      w, h, p,
      color, 0, 2, 0.17
    );

    bg.setFill(C.card, 0.95);

    const head = txt(
      title,
      P ? 24 : 24,
      color,
      [p[0], p[1] + h * 0.17, 0],
      false,
      w - 0.25
    );

    const sub = txt(
      subtitle,
      P ? 17 : 17,
      C.ink,
      [p[0], p[1] - h * 0.19, 0],
      false,
      w - 0.25
    );

    return new M.VGroup(bg, head, sub);
  }

  const causeNode = causalNode(
    'Hidden leak',
    'Water escapes from pipe',
    CAUSE_POS,
    CAUSE_W,
    CAUSE_H,
    LEAK_COLOR
  );

  const callsNode = causalNode(
    '2 calls',
    'Resident reports problem',
    CALL_EFFECT_POS,
    EFFECT_W,
    EFFECT_H,
    CALL_COLOR
  );

  const urgentNode = causalNode(
    'Urgent visit',
    'Crew needed today',
    URGENT_EFFECT_POS,
    EFFECT_W,
    EFFECT_H,
    URGENT_COLOR
  );

  function causalArrow(side, color) {
    if (P) {
      const dest = side < 0
        ? CALL_EFFECT_POS
        : URGENT_EFFECT_POS;

      return arrow(
        [
          CAUSE_POS[0] + side * 0.65,
          CAUSE_POS[1] - CAUSE_H / 2 - 0.08,
          0
        ],
        [
          dest[0],
          dest[1] + EFFECT_H / 2 + 0.08,
          0
        ],
        color,
        3
      );
    }

    const dest = side < 0
      ? CALL_EFFECT_POS
      : URGENT_EFFECT_POS;

    return arrow(
      [
        CAUSE_POS[0] + side * (CAUSE_W / 2 + 0.08),
        CAUSE_POS[1],
        0
      ],
      [
        dest[0] - side * (EFFECT_W / 2 + 0.08),
        dest[1],
        0
      ],
      color,
      3
    );
  }

  const leakToCalls = causalArrow(-1, CALL_COLOR);
  const leakToUrgent = causalArrow(1, URGENT_COLOR);

  const causalHeading = txt(
    'WHAT PRODUCES THE REAL OUTCOMES?',
    P ? 19 : 20,
    C.ink,
    [0, P ? 3.04 : 1.24, 0],
    true,
    FW - 0.90
  );

  // 11 — Draw the hidden leak in the middle.
  await until(S(11));
  await play(
    ...outs([
      realWorldTag,
      home.base,
      home.leak,
      home.activeWater,
      home.damage,
      resident,
      callOne,
      callTwo,
      callOneLabel,
      callTwoLabel
    ]),
    new M.FadeIn(causalHeading),
    new M.FadeIn(causeNode),
    ...dropBox(),
    ...say('START WITH THE HIDDEN LEAK')
  );

  // 12 — Draw an arrow from the leak to the two calls.
  await until(S(12));
  await play(
    new M.FadeIn(leakToCalls),
    new M.FadeIn(callsNode),
    ...say('THE LEAK LEADS TO TWO CALLS')
  );

  // 13 — The leak explains why the resident calls twice.
  await until(S(13));
  await play(
    new M.Indicate(
      leakToCalls,
      { color: CALL_COLOR }
    ),
    ...fbox([
      ['Hidden leak → repeated calls', CALL_COLOR],
      'The resident responds to the problem'
    ]),
    ...say('THE LEAK IS THE REASON FOR THE CALLS')
  );

  // 14 — Draw a second arrow to urgent need.
  await until(S(14));
  await play(
    new M.FadeIn(leakToUrgent),
    new M.FadeIn(urgentNode),
    ...fbox([
      ['Hidden leak → urgent need', URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('THE LEAK ALSO CAUSES URGENT NEED', URGENT_COLOR)
  );

  // 15 — The same leak explains both outcomes.
  await until(S(15));
  await play(
    new M.Indicate(
      causeNode,
      { color: LEAK_COLOR }
    ),
    new M.Indicate(
      leakToCalls,
      { color: CALL_COLOR }
    ),
    new M.Indicate(
      leakToUrgent,
      { color: URGENT_COLOR }
    ),
    ...fbox([
      ['One leak', LEAK_COLOR],
      ['Two effects: calls and urgent need', C.ink]
    ]),
    ...say('ONE CAUSE PRODUCES TWO EFFECTS')
  );

  // 16 — Define a shared cause.
  await until(S(16));

  const sharedCauseTag = pill(
    'SHARED CAUSE',
    C.green,
    19
  );

  sharedCauseTag.moveTo([
    0,
    P ? -2.25 : -1.05,
    0
  ]);

  await play(
    new M.FadeIn(sharedCauseTag),
    ...fbox([
      ['Shared cause', C.green],
      'Something that produces both effects'
    ], C.green),
    ...say('ONE CAUSE OF TWO EFFECTS = SHARED CAUSE', C.green)
  );

  // 17 — Define causation.
  await until(S(17));
  await play(
    ...fbox([
      ['Causation', URGENT_COLOR],
      'One thing produces a change in another'
    ], URGENT_COLOR),
    ...say('CAUSATION = PRODUCING A CHANGE', URGENT_COLOR)
  );

  // 18 — The leak causes urgent need.
  await until(S(18));
  await play(
    new M.Indicate(
      leakToUrgent,
      { color: URGENT_COLOR }
    ),
    new M.Indicate(
      urgentNode,
      { color: URGENT_COLOR }
    ),
    ...fbox([
      ['The physical leak causes the urgent need', URGENT_COLOR],
      'The calls are another effect of the leak'
    ], URGENT_COLOR),
    ...say('THE LEAK CAUSES THE NEED FOR A VISIT', URGENT_COLOR)
  );

  // ------------------------------------------------------------
  // What the model can and cannot see.
  //
  // The physical leak is not supplied as an input.
  // The model uses only recorded calls and recorded pipe type.
  // ------------------------------------------------------------

  const HIDDEN_X = P ? 0 : -4.50;
  const HIDDEN_Y = P ? 2.02 : 0.18;

  const INPUT_X = P ? 0 : -0.90;
  const INPUT_Y = P ? 0.34 : 0.18;

  const MODEL_X = P ? 0 : 3.00;
  const MODEL_Y = P ? -1.54 : 0.18;

  function hiddenLeakCard() {
    const w = P ? 4.20 : 2.85;
    const h = P ? 0.98 : 1.38;

    const bg = rect(
      w, h,
      [HIDDEN_X, HIDDEN_Y, 0],
      C.muted,
      0,
      1.6,
      0.13
    );

    bg.setFill(C.card, 0.92);

    const title = txt(
      'Hidden leak',
      21,
      LEAK_COLOR,
      [HIDDEN_X, HIDDEN_Y + 0.20, 0],
      false,
      w - 0.20
    );

    const note = txt(
      'NOT A MODEL INPUT',
      15,
      C.muted,
      [HIDDEN_X, HIDDEN_Y - 0.22, 0],
      true,
      w - 0.18
    );

    return new M.VGroup(bg, title, note);
  }

  const hiddenCard = hiddenLeakCard();

  const hiddenBoundary = P
    ? new M.DashedLine({
        start: [-3.10, 1.27, 0],
        end: [3.10, 1.27, 0],
        color: C.muted,
        strokeWidth: 2
      })
    : new M.DashedLine({
        start: [-2.85, -1.36, 0],
        end: [-2.85, 1.39, 0],
        color: C.muted,
        strokeWidth: 2
      });

  const hiddenLabel = txt(
    'Not observed by the model',
    P ? 17 : 15,
    C.muted,
    [
      P ? 0 : -4.50,
      P ? 2.87 : 1.17,
      0
    ],
    false,
    P ? 6.4 : 3.0
  );

  const modelW = P ? 4.95 : 3.35;
  const modelH = P ? 1.15 : 1.55;

  function modelCard(value) {
    const bg = rect(
      modelW,
      modelH,
      [MODEL_X, MODEL_Y, 0],
      PIPE_COLOR,
      0,
      2,
      0.14
    );

    bg.setFill(C.card, 0.96);

    const title = txt(
      'TRAINED MODEL',
      21,
      PIPE_COLOR,
      [MODEL_X, MODEL_Y + modelH * 0.27, 0],
      true,
      modelW - 0.24
    );

    const output = txt(
      value === null
        ? 'Predicted risk: ?'
        : `Predicted risk: ${value}%`,
      P ? 23 : 21,
      value === null ? C.muted : RISK_COLOR,
      [MODEL_X, MODEL_Y - modelH * 0.15, 0],
      false,
      modelW - 0.24
    );

    return new M.VGroup(bg, title, output);
  }

  let modelNow = modelCard(null);

  // 19 — The model cannot see the hidden leak.
  await until(S(19));
  await play(
    ...outs([
      causalHeading,
      causeNode,
      callsNode,
      urgentNode,
      leakToCalls,
      leakToUrgent,
      sharedCauseTag
    ]),
    new M.FadeIn(hiddenCard),
    new M.Create(hiddenBoundary),
    new M.FadeIn(hiddenLabel),
    new M.FadeIn(modelNow),
    ...fbox([
      ['The physical leak is hidden from the model', LEAK_COLOR]
    ]),
    ...say('THE MODEL CANNOT SEE THE HIDDEN LEAK', C.violet)
  );

  const visibleCalls = smallCard(
    'Calls',
    '2',
    P ? -1.60 : INPUT_X,
    P ? INPUT_Y : INPUT_Y + 0.48,
    P ? 2.45 : 2.55,
    CALL_COLOR
  );

  const visiblePipe = smallCard(
    'Pipe type',
    'Older',
    P ? 1.60 : INPUT_X,
    P ? INPUT_Y : INPUT_Y - 0.48,
    P ? 2.45 : 2.55,
    PIPE_COLOR
  );

  const inputLabel = txt(
    'RECORDED FEATURES',
    17,
    C.ink,
    [
      INPUT_X,
      P ? 0.98 : 1.17,
      0
    ],
    true,
    P ? 6.50 : 3.20
  );

  const modelInputArrow = P
    ? arrow(
        [0, -0.15, 0],
        [0, MODEL_Y + modelH / 2 + 0.08, 0],
        PIPE_COLOR,
        2.5
      )
    : arrow(
        [INPUT_X + 1.37, INPUT_Y, 0],
        [MODEL_X - modelW / 2 - 0.10, MODEL_Y, 0],
        PIPE_COLOR,
        2.5
      );

  // 20 — The model sees calls and pipe type.
  await until(S(20));
  await play(
    new M.FadeIn(visibleCalls),
    new M.FadeIn(visiblePipe),
    new M.FadeIn(inputLabel),
    new M.FadeIn(modelInputArrow),
    ...fbox([
      ['Calls and pipe type', PIPE_COLOR],
      'These are the features the model receives'
    ], PIPE_COLOR),
    ...say('THE MODEL SEES ONLY THE RECORDED FEATURES')
  );

  // 21 — These features help estimate urgency.
  await until(S(21));
  await play(
    new M.Transform(
      modelNow,
      modelCard(A_ORIGINAL.risk)
    ),
    ...fbox([
      ['2 calls + older pipe', PIPE_COLOR],
      ['Predicted risk = 90%', RISK_COLOR]
    ]),
    ...say('THE FEATURES HELP THE MODEL ESTIMATE RISK')
  );

  // ------------------------------------------------------------
  // Original request and hypothetical copy.
  //
  // The original remains visible and unchanged.
  // Only the copied call number changes.
  // No change is made to the real pipe or confirmed outcome.
  // ------------------------------------------------------------

  // laptop: original and copy side by side; phone: stacked, full width
  const ORIG_X = P ? 0 : -3.00;
  const ORIG_Y = P ? 1.30 : -0.10;
  const COPY_X = P ? 0 : 3.00;
  const COPY_Y = P ? -1.55 : -0.10;
  const COPY_W = P ? 6.20 : 4.45;
  const COPY_H = P ? 2.35 : 2.25;

  let originalCard = requestCard(
    'ORIGINAL: HOME A',
    A_ORIGINAL.calls,
    A_ORIGINAL.risk,
    ORIG_X,
    ORIG_Y,
    COPY_W,
    COPY_H,
    C.muted,
    true
  );

  let copiedCard = requestCard(
    'COPY: HOME A',
    A_ORIGINAL.calls,
    A_ORIGINAL.risk,
    COPY_X,
    COPY_Y,
    COPY_W,
    COPY_H,
    CALL_COLOR,
    true
  );

  const copyArrow = P
    ? arrow(
      [0, ORIG_Y - COPY_H / 2 - 0.04, 0],
      [0, COPY_Y + COPY_H / 2 + 0.04, 0],
      C.violet,
      2.5
    )
    : arrow(
      [ORIG_X + COPY_W / 2 + 0.04, COPY_Y, 0],
      [COPY_X - COPY_W / 2 - 0.04, COPY_Y, 0],
      C.violet,
      2.5
    );

  const copyHeading = txt(
    'EDIT THE RECORD, NOT THE HOME',
    P ? 21 : 22,
    C.violet,
    [0, P ? 2.95 : 1.36, 0],
    true,
    FW - 0.80
  );

  // 22 — Make a copy of Home A's request.
  await until(S(22));
  await play(
    ...outs([
      hiddenCard,
      hiddenBoundary,
      hiddenLabel,
      visibleCalls,
      visiblePipe,
      inputLabel,
      modelInputArrow,
      modelNow
    ]),
    new M.FadeIn(copyHeading),
    new M.FadeIn(originalCard.group),
    new M.FadeIn(copiedCard.group),
    new M.FadeIn(copyArrow),
    ...fbox([
      ['Original request saved', C.muted],
      ['Work on a separate copy', CALL_COLOR]
    ]),
    ...say('MAKE A COPY OF HOME A’S REQUEST', C.violet)
  );

  // 23 — Change copied calls from two to zero.
  await until(S(23));

  const editedCopy = requestCard(
    'COPY: HOME A',
    A_COPY.calls,
    null,
    COPY_X,
    COPY_Y,
    COPY_W,
    COPY_H,
    CALL_COLOR,
    true
  );

  await play(
    ...replaceCard(copiedCard, editedCopy),
    ...fbox([
      ['Original calls: 2', C.muted],
      ['Copied calls: 2 → 0', CALL_COLOR]
    ]),
    ...say('CHANGE ONLY THE COPIED CALL NUMBER')
  );

  copiedCard = editedCopy;

  // 24 — Keep the older pipe unchanged.
  await until(S(24));

  const pipeFocus = rect(
    COPY_W * 0.48,
    (P ? 0.70 : 0.57) + 0.10,
    [
      COPY_X + COPY_W * 0.22,
      COPY_Y + COPY_H * 0.13,
      0
    ],
    PIPE_COLOR,
    0,
    2.4,
    0.11
  );

  await play(
    new M.Create(pipeFocus),
    ...fbox([
      ['Calls on the copy: 0', CALL_COLOR],
      ['Pipe type: still Older', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('THE PIPE IS STILL LISTED AS OLDER', PIPE_COLOR)
  );

  const sameModelTag = pill(
    'SAME TRAINED MODEL',
    PIPE_COLOR,
    18
  );

  sameModelTag.moveTo([
    P ? 1.75 : 0,
    P ? (ORIG_Y - COPY_H / 2 + COPY_Y + COPY_H / 2) / 2 : -1.58,
    0
  ]);

  // 25 — Give the edited information to the same model.
  await until(S(25));
  await play(
    new M.FadeOut(pipeFocus),
    new M.FadeIn(sameModelTag),
    ...fbox([
      ['Supply the copied features', CALL_COLOR],
      ['No retraining and no physical repair', PIPE_COLOR]
    ], PIPE_COLOR),
    ...say('ASK THE SAME MODEL AGAIN', PIPE_COLOR)
  );

  // 26 — Predicted risk falls from 90% to 30%.
  await until(S(26));

  const newPredictionCard = requestCard(
    'COPY: HOME A',
    A_COPY.calls,
    A_COPY.risk,
    COPY_X,
    COPY_Y,
    COPY_W,
    COPY_H,
    CALL_COLOR,
    true
  );

  await play(
    ...replaceCard(copiedCard, newPredictionCard),
    ...fbox([
      ['Original predicted risk: 90%', C.muted],
      ['New predicted risk: 30%', RISK_COLOR]
    ]),
    ...say('THE MODEL’S PREDICTION FALLS: 90% → 30%')
  );

  copiedCard = newPredictionCard;

  // ------------------------------------------------------------
  // Return to the real home.
  //
  // The edited record remains visible next to the physical home.
  // The real leak and damage are exactly as before.
  // ------------------------------------------------------------

  const RETURN_HOME_X = P ? 0 : -3.90;
  const RETURN_HOME_Y = P ? 0.83 : -0.27;
  const RETURN_SCALE = P ? 0.96 : 0.76;

  const returnedHome = physicalHome(
    RETURN_HOME_X,
    RETURN_HOME_Y,
    RETURN_SCALE
  );

  const RECORD_X = P ? 0 : 3.35;
  const RECORD_Y = P ? -1.96 : -0.06;

  const RECORD_W = P ? 5.75 : 4.75;
  const RECORD_H = P ? 1.42 : 2.25;

  function editedRecordSummary() {
    const bg = rect(
      RECORD_W,
      RECORD_H,
      [RECORD_X, RECORD_Y, 0],
      CALL_COLOR,
      0,
      1.8,
      0.14
    );

    bg.setFill(C.card, 0.96);

    const title = txt(
      'EDITED COPY ONLY',
      18,
      CALL_COLOR,
      [
        RECORD_X,
        RECORD_Y + RECORD_H * 0.35,
        0
      ],
      true,
      RECORD_W - 0.24
    );

    const featureText = txt(
      '0 calls  |  Older pipe',
      20,
      PIPE_COLOR,
      [
        RECORD_X,
        RECORD_Y + RECORD_H * 0.12,
        0
      ],
      false,
      RECORD_W - 0.24
    );

    const riskText = txt(
      'Predicted risk: 30%',
      P ? 24 : 25,
      RISK_COLOR,
      [
        RECORD_X,
        RECORD_Y - RECORD_H * 0.20,
        0
      ],
      true,
      RECORD_W - 0.24
    );

    return new M.VGroup(
      bg,
      title,
      featureText,
      riskText
    );
  }

  const editedSummary = editedRecordSummary();

  const stillUrgent = urgencyMark(
    P ? 0 : -0.95,
    P ? -3.10 : -0.02,
    'STILL NEEDS A VISIT'
  );

  // 27 — Look again at the real home.
  await until(S(27));
  await play(
    ...outs([
      originalCard.group,
      copiedCard.group,
      copyArrow,
      copyHeading,
      sameModelTag
    ]),
    new M.FadeIn(returnedHome.base),
    new M.FadeIn(returnedHome.leak),
    new M.FadeIn(returnedHome.activeWater),
    new M.FadeIn(returnedHome.damage),
    new M.FadeIn(editedSummary),
    ...dropBox(),
    ...say('NOW LOOK AT THE REAL HOME AGAIN')
  );

  // 28 — The hidden leak is still there.
  await until(S(28));
  await play(
    new M.Indicate(
      returnedHome.leak,
      { color: LEAK_COLOR }
    ),
    ...fbox([
      ['The copied calls changed', CALL_COLOR],
      ['The hidden leak did not', LEAK_COLOR]
    ]),
    ...say('THE HIDDEN LEAK IS STILL THERE')
  );

  // 29 — Water is still damaging the home.
  await until(S(29));
  await play(
    new M.Indicate(
      returnedHome.activeWater,
      { color: LEAK_COLOR }
    ),
    new M.Indicate(
      returnedHome.damage,
      { color: LEAK_COLOR }
    ),
    ...say('WATER IS STILL DAMAGING THE HOME')
  );

  // 30 — Home A still needs an urgent visit.
  await until(S(30));
  await play(
    new M.FadeIn(stillUrgent),
    ...fbox([
      ['Predicted risk on the copy: 30%', RISK_COLOR],
      ['Real need: still urgent', URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('HOME A STILL NEEDS AN URGENT VISIT', URGENT_COLOR)
  );

  // 31 — The prediction changed, but the problem did not.
  await until(S(31));
  await play(
    new M.Indicate(
      editedSummary,
      { color: CALL_COLOR }
    ),
    new M.Indicate(
      stillUrgent,
      { color: URGENT_COLOR }
    ),
    ...fbox([
      ['Prediction changed', CALL_COLOR],
      ['Physical problem unchanged', URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('CHANGED PREDICTION ≠ CHANGED REALITY', URGENT_COLOR)
  );

  // ------------------------------------------------------------
  // Measure the drop in predicted risk.
  //
  // Both bars have exactly the same 0–100% scale.
  // The 60-point difference is a model-prediction difference.
  // It is not a reduction in actual urgent need.
  // ------------------------------------------------------------

  const BAR_W = P ? 5.40 : 7.90;
  const BAR_H = P ? 0.49 : 0.37;

  const BAR_LEFT = -BAR_W / 2 - 0.24;

  const OLD_BAR_Y = P ? 1.68 : 0.82;
  const NEW_BAR_Y = P ? -0.19 : -0.47;

  const barX = v =>
    BAR_LEFT + BAR_W * v / 100;

  function comparisonBar(label, value, y, color) {
    const track = solidRect(
      BAR_W,
      BAR_H,
      [BAR_LEFT + BAR_W / 2, y, 0],
      C.muted,
      0.14
    );

    const w = BAR_W * value / 100;

    const fill = solidRect(
      w,
      BAR_H,
      [BAR_LEFT + w / 2, y, 0],
      color,
      0.86
    );

    const glow = solidRect(
      w,
      BAR_H + 0.08,
      [BAR_LEFT + w / 2, y, 0],
      color,
      0.10
    );

    const title = T(
      label,
      P ? 21 : 21,
      C.ink
    );

    if (title.getWidth() > BAR_W) {
      title.scale(BAR_W / title.getWidth());
    }

    title.moveTo([
      BAR_LEFT + title.getWidth() / 2,
      y + (P ? 0.56 : 0.42),
      0
    ]);

    const valueText = txt(
      `${value}%`,
      P ? 28 : 27,
      color,
      [BAR_LEFT + BAR_W + 0.62, y, 0],
      true,
      1.0
    );

    const zero = txt(
      '0%',
      14,
      C.muted,
      [barX(0), y - BAR_H / 2 - 0.22, 0],
      true
    );

    const hundred = txt(
      '100%',
      14,
      C.muted,
      [barX(100), y - BAR_H / 2 - 0.22, 0],
      true
    );

    return new M.VGroup(
      track,
      glow,
      fill,
      title,
      valueText,
      zero,
      hundred
    );
  }

  const oldRiskBar = comparisonBar(
    'Original prediction — 2 calls',
    A_ORIGINAL.risk,
    OLD_BAR_Y,
    C.muted
  );

  const newRiskBar = comparisonBar(
    'Edited-copy prediction — 0 calls',
    A_COPY.risk,
    NEW_BAR_Y,
    RISK_COLOR
  );

  // 32 — Measure the change in predicted risk.
  await until(S(32));
  await play(
    ...outs([
      returnedHome.base,
      returnedHome.leak,
      returnedHome.activeWater,
      returnedHome.damage,
      editedSummary,
      stillUrgent
    ]),
    new M.FadeIn(oldRiskBar),
    new M.FadeIn(newRiskBar),
    ...dropBox(),
    ...say('MEASURE THE DROP IN PREDICTED RISK')
  );

  // 33 — Introduce a short formula.
  await until(S(33));
  await play(
    ...fbox([
      ['Compare the two predictions', RISK_COLOR],
      'Subtract the new risk from the original risk'
    ]),
    ...say('ONE SHORT FORMULA')
  );

  // 34 — Drop = original predicted risk − new predicted risk.
  await until(S(34));
  await play(
    ...fbox([
      ['Drop in predicted risk', RISK_COLOR],
      '= original predicted risk − new predicted risk'
    ]),
    ...say('DROP = ORIGINAL RISK − NEW RISK')
  );

  const DIFF_Y = P ? -1.32 : -1.27;

  const dropBracket = new M.VGroup(
    line(
      [barX(A_COPY.risk), DIFF_Y, 0],
      [barX(A_ORIGINAL.risk), DIFF_Y, 0],
      URGENT_COLOR,
      3
    ),
    line(
      [barX(A_COPY.risk), DIFF_Y - 0.10, 0],
      [barX(A_COPY.risk), DIFF_Y + 0.10, 0],
      URGENT_COLOR,
      2.5
    ),
    line(
      [barX(A_ORIGINAL.risk), DIFF_Y - 0.10, 0],
      [barX(A_ORIGINAL.risk), DIFF_Y + 0.10, 0],
      URGENT_COLOR,
      2.5
    ),
    txt(
      `${RISK_DROP} percentage points`,
      P ? 23 : 21,
      URGENT_COLOR,
      [
        (barX(A_COPY.risk) + barX(A_ORIGINAL.risk)) / 2,
        DIFF_Y - 0.30,
        0
      ],
      false,
      BAR_W
    )
  );

  // 35 — 90 minus 30 gives a drop of 60 percentage points.
  await until(S(35));
  await play(
    new M.FadeIn(dropBracket),
    ...fbox([
      ['90% − 30%', C.ink],
      [`= ${RISK_DROP} percentage points`, URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('PREDICTED RISK DROPS BY 60 POINTS', URGENT_COLOR)
  );

  // 36 — This measures the model's response to changed inputs.
  await until(S(36));
  await play(
    new M.Indicate(
      dropBracket,
      { color: CALL_COLOR }
    ),
    ...fbox([
      ['Input changed: 2 calls → 0 calls', CALL_COLOR],
      ['Model response: 60-point drop', RISK_COLOR]
    ]),
    ...say('THIS IS A CHANGE IN THE MODEL’S PREDICTION')
  );

  // 37 — It is not a reduction in real urgent need.
  await until(S(37));
  await play(
    ...fbox([
      ['60 points of predicted-risk reduction', RISK_COLOR],
      ['Not 60 points of reduced real urgent need', URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('THE REAL URGENT NEED WAS NOT REDUCED', URGENT_COLOR)
  );

  // ------------------------------------------------------------
  // A different action: repair the leak.
  //
  // Return to the physical home.
  // Show a crew working on the actual pipe rather than
  // editing a model input.
  // ------------------------------------------------------------

  const REPAIR_HOME_X = P ? 0 : -2.50;
  const REPAIR_HOME_Y = P ? 0.80 : -0.25;
  const REPAIR_SCALE = P ? 1.0 : 0.78;

  const repairHome = physicalHome(
    REPAIR_HOME_X,
    REPAIR_HOME_Y,
    REPAIR_SCALE
  );

  const CREW_X = P ? -1.35 : 2.85;
  const CREW_Y = P ? -2.02 : 0.10;

  function crewIcon(x, y, scale = 1) {
    const worker = person(
      x,
      y,
      C.ink,
      scale
    );

    const helmet = new M.Arc({
      radius: 0.27 * scale,
      startAngle: 0,
      angle: Math.PI,
      color: URGENT_COLOR,
      strokeWidth: 2
    });

    helmet.setFill(URGENT_COLOR, 0.88);
    helmet.moveTo([
      x,
      y + 0.73 * scale,
      0
    ]);

    const brim = line(
      [
        x - 0.31 * scale,
        y + 0.70 * scale,
        0
      ],
      [
        x + 0.31 * scale,
        y + 0.70 * scale,
        0
      ],
      URGENT_COLOR,
      3
    );

    const toolbox = rect(
      0.65 * scale,
      0.44 * scale,
      [
        x + 0.58 * scale,
        y - 0.46 * scale,
        0
      ],
      REPAIR_COLOR,
      0.18,
      2,
      0.06
    );

    const handle = new M.Arc({
      radius: 0.13 * scale,
      startAngle: 0,
      angle: Math.PI,
      color: REPAIR_COLOR,
      strokeWidth: 2
    });

    handle.moveTo([
      x + 0.58 * scale,
      y - 0.20 * scale,
      0
    ]);

    const label = txt(
      'Repair crew',
      19,
      REPAIR_COLOR,
      [x, y - 1.0 * scale, 0],
      false,
      2.20
    );

    return new M.VGroup(
      worker,
      helmet,
      brim,
      toolbox,
      handle,
      label
    );
  }

  const repairCrew = crewIcon(
    CREW_X,
    CREW_Y,
    P ? 0.84 : 1.05
  );

  const repairTarget = [
    REPAIR_HOME_X,
    REPAIR_HOME_Y - 1.20 * REPAIR_SCALE,
    0
  ];

  const repairActionArrow = P
    ? arrow(
        [CREW_X + 0.50, CREW_Y + 0.35, 0],
        [
          repairTarget[0] - 0.15,
          repairTarget[1] - 0.25,
          0
        ],
        REPAIR_COLOR,
        2.5
      )
    : arrow(
        [CREW_X - 0.75, CREW_Y - 0.30, 0],
        [
          repairTarget[0] + 0.32,
          repairTarget[1],
          0
        ],
        REPAIR_COLOR,
        2.5
      );

  // 38 — Imagine sending a crew to repair the leak.
  await until(S(38));
  await play(
    ...outs([
      oldRiskBar,
      newRiskBar,
      dropBracket
    ]),
    new M.FadeIn(repairHome.base),
    new M.FadeIn(repairHome.leak),
    new M.FadeIn(repairHome.activeWater),
    new M.FadeIn(repairHome.damage),
    new M.FadeIn(repairCrew),
    new M.FadeIn(repairActionArrow),
    ...fbox([
      ['A different action', REPAIR_COLOR],
      'Repair the actual leaking pipe'
    ], REPAIR_COLOR),
    ...say('SEND A CREW TO REPAIR THE LEAK', REPAIR_COLOR)
  );

  const stoppedWaterTag = pill(
    'NO MORE ESCAPING WATER',
    REPAIR_COLOR,
    18
  );

  stoppedWaterTag.moveTo([
    P ? 1.35 : CREW_X,
    P ? -2.02 : -1.27,
    0
  ]);

  // 39 — A successful repair stops water escaping.
  await until(S(39));
  await play(
    new M.FadeOut(repairHome.leak),
    new M.FadeOut(repairHome.activeWater),
    new M.FadeIn(repairHome.sealed),
    new M.FadeOut(repairActionArrow),
    new M.FadeIn(stoppedWaterTag),
    ...fbox([
      ['Successful repair: leak sealed', REPAIR_COLOR],
      'Water is no longer escaping from the pipe'
    ], REPAIR_COLOR),
    ...say('THE SUCCESSFUL REPAIR STOPS THE LEAK', REPAIR_COLOR)
  );

  // 40 — Unlike editing a request, repair changes the real home.
  await until(S(40));
  await play(
    new M.Indicate(
      repairHome.sealed,
      { color: REPAIR_COLOR }
    ),
    ...fbox([
      ['Editing a record changes information', CALL_COLOR],
      ['Repairing a leak changes the physical home', REPAIR_COLOR]
    ], REPAIR_COLOR),
    ...say('REPAIR CHANGES THE REAL CONDITION', REPAIR_COLOR)
  );

  // 41 — Define intervention.
  await until(S(41));
  await play(
    ...fbox([
      ['Intervention', REPAIR_COLOR],
      'An action that changes something in the real world'
    ], REPAIR_COLOR),
    ...say('REAL-WORLD ACTION = INTERVENTION', REPAIR_COLOR)
  );

  // ------------------------------------------------------------
  // Two fundamentally different questions.
  //
  // Model explanation:
  //   What happens to a prediction if we edit information?
  //
  // Causal analysis:
  //   What happens in reality if we repair a leak?
  //
  // Only the model-prediction change has a measured value.
  // The real-world effect requires separate evidence.
  // ------------------------------------------------------------

  const PANEL_W = P ? 6.45 : 5.45;
  const PANEL_H = P ? 2.15 : 2.72;

  const MODEL_PANEL_POS = P
    ? [0, 1.78, 0]
    : [-3.15, -0.08, 0];

  const WORLD_PANEL_POS = P
    ? [0, -0.80, 0]
    : [3.15, -0.08, 0];

  function comparisonPanel(
    title,
    subtitle,
    result,
    note,
    p,
    color
  ) {
    const x = p[0];
    const y = p[1];

    const bg = rect(
      PANEL_W,
      PANEL_H,
      p,
      color,
      0,
      2,
      0.16
    );

    bg.setFill(C.card, 0.96);

    const titleText = txt(
      title,
      P ? 23 : 25,
      color,
      [x, y + PANEL_H * 0.36, 0],
      false,
      PANEL_W - 0.35
    );

    const subtitleText = txt(
      subtitle,
      P ? 19 : 20,
      C.ink,
      [x, y + PANEL_H * 0.12, 0],
      false,
      PANEL_W - 0.35
    );

    const separator = line(
      [
        x - PANEL_W * 0.42,
        y - PANEL_H * 0.015,
        0
      ],
      [
        x + PANEL_W * 0.42,
        y - PANEL_H * 0.015,
        0
      ],
      C.muted,
      1.2
    );

    const resultText = txt(
      result,
      P ? 25 : 25,
      color,
      [x, y - PANEL_H * 0.17, 0],
      false,
      PANEL_W - 0.35
    );

    const noteText = txt(
      note,
      P ? 17 : 17,
      C.muted,
      [x, y - PANEL_H * 0.37, 0],
      false,
      PANEL_W - 0.30
    );

    return {
      group: new M.VGroup(
        bg,
        titleText,
        subtitleText,
        separator,
        resultText,
        noteText
      ),
      resultText,
      titleText
    };
  }

  let modelPanel = comparisonPanel(
    'EDIT THE REQUEST',
    'Copied calls: 2 → 0',
    '60-point predicted-risk drop',
    'The physical leak was unchanged',
    MODEL_PANEL_POS,
    CALL_COLOR
  );

  let worldPanel = comparisonPanel(
    'REPAIR THE LEAK',
    'Escaping water stops',
    'Effect on real urgent need: ?',
    'The numerical effect is not established',
    WORLD_PANEL_POS,
    REPAIR_COLOR
  );

  const notEqual = txt(
    '≠',
    P ? 34 : 36,
    URGENT_COLOR,
    [
      0,
      P
        ? (MODEL_PANEL_POS[1] + WORLD_PANEL_POS[1]) / 2
        : 0,
      0
    ],
    true
  );

  // 42 — The 60-point drop does not measure the effect of repair.
  await until(S(42));
  await play(
    ...outs([
      repairHome.base,
      repairHome.damage,
      repairHome.sealed,
      repairCrew,
      stoppedWaterTag
    ]),
    new M.FadeIn(modelPanel.group),
    new M.FadeIn(worldPanel.group),
    new M.FadeIn(notEqual),
    ...fbox([
      ['Model-prediction drop: 60 points', CALL_COLOR],
      ['Real-world effect of repair: not estimated', REPAIR_COLOR]
    ], URGENT_COLOR),
    ...say('THE 60 POINTS DO NOT MEASURE THE REPAIR', URGENT_COLOR)
  );

  // 43 — Other evidence is needed to measure the repair effect.
  await until(S(43));

  const evidenceNote = pill(
    'OTHER EVIDENCE NEEDED',
    URGENT_COLOR,
    17
  );

  evidenceNote.moveTo([
    WORLD_PANEL_POS[0],
    P ? -2.34 : -1.77,
    0
  ]);

  await play(
    new M.FadeIn(evidenceNote),
    new M.Indicate(
      worldPanel.resultText,
      { color: URGENT_COLOR }
    ),
    ...fbox([
      ['We need evidence about actual repair outcomes', URGENT_COLOR],
      'The prediction explanation alone is not enough'
    ], URGENT_COLOR),
    ...say('USE OTHER EVIDENCE TO MEASURE REAL EFFECTS', URGENT_COLOR)
  );

  // ------------------------------------------------------------
  // Distinguish the two types of analysis.
  // ------------------------------------------------------------

  // 44 — Prediction explanations reveal how models use information.
  await until(S(44));

  const explanationPanel = comparisonPanel(
    'MODEL EXPLANATION',
    'Change the information',
    'How does the prediction change?',
    'Study the trained model',
    MODEL_PANEL_POS,
    CALL_COLOR
  );

  await play(
    new M.FadeOut(modelPanel.group),
    new M.FadeIn(explanationPanel.group),
    ...fbox([
      ['Prediction explanations', CALL_COLOR],
      'Help us understand how the model uses information'
    ]),
    ...say('MODEL EXPLANATION: UNDERSTAND THE MODEL')
  );

  modelPanel = explanationPanel;

  // 45 — Causal analysis studies real-world changes.
  await until(S(45));

  const causalAnalysisPanel = comparisonPanel(
    'CAUSAL ANALYSIS',
    'Change something in reality',
    'How does the real outcome change?',
    'Requires evidence about real-world effects',
    WORLD_PANEL_POS,
    REPAIR_COLOR
  );

  await play(
    new M.FadeOut(worldPanel.group),
    new M.FadeIn(causalAnalysisPanel.group),
    new M.FadeOut(evidenceNote),
    ...fbox([
      ['Causal analysis', REPAIR_COLOR],
      'Helps us understand the effects of real actions'
    ], REPAIR_COLOR),
    ...say('CAUSAL ANALYSIS: UNDERSTAND REAL EFFECTS', REPAIR_COLOR)
  );

  worldPanel = causalAnalysisPanel;

  // ------------------------------------------------------------
  // Final causal reminder.
  //
  // Revisit the shared-cause picture.
  // Calls are useful information about the problem, but
  // suppressing or editing calls does not repair the leak.
  // ------------------------------------------------------------

  // 46 — A useful predictor need not be the cause of the problem.
  await until(S(46));
  await play(
    ...outs([
      modelPanel.group,
      worldPanel.group,
      notEqual
    ]),
    new M.FadeIn(causeNode),
    new M.FadeIn(callsNode),
    new M.FadeIn(urgentNode),
    new M.FadeIn(leakToCalls),
    new M.FadeIn(leakToUrgent),
    ...fbox([
      ['Calls contain useful information', CALL_COLOR],
      ['The leak is the physical cause in this example', LEAK_COLOR]
    ], URGENT_COLOR),
    ...say('A USEFUL PREDICTOR NEED NOT BE A CAUSE', URGENT_COLOR)
  );

  const fewerCallsNode = causalNode(
    'Fewer calls',
    'Less reporting',
    CALL_EFFECT_POS,
    EFFECT_W,
    EFFECT_H,
    CALL_COLOR
  );

  const noRepairTag = pill(
    'FEWER CALLS DO NOT SEAL A LEAK',
    URGENT_COLOR,
    P ? 17 : 18
  );

  noRepairTag.moveTo([
    0,
    P ? -2.38 : -1.22,
    0
  ]);

  // 47 — Making fewer calls does not repair a leaking pipe.
  await until(S(47));
  await play(
    new M.FadeOut(callsNode),
    new M.FadeOut(leakToCalls),
    new M.FadeIn(fewerCallsNode),
    new M.FadeIn(noRepairTag),
    new M.Indicate(
      causeNode,
      { color: LEAK_COLOR }
    ),
    new M.Indicate(
      leakToUrgent,
      { color: URGENT_COLOR }
    ),
    ...fbox([
      ['Fewer calls do not remove the leak', CALL_COLOR],
      ['The physical problem still needs attention', URGENT_COLOR]
    ], URGENT_COLOR),
    ...say('MAKING FEWER CALLS DOES NOT REPAIR A PIPE', URGENT_COLOR)
  );

  // ------------------------------------------------------------
  // Final picture.
  //
  // Reconnect the two questions to their concrete examples.
  // No real-world numerical effect is invented.
  // ------------------------------------------------------------

  const finalModel = comparisonPanel(
    'EXPLAIN A PREDICTION',
    'Edit calls on the copied request',
    '90% → 30%',
    'A 60-percentage-point model response',
    MODEL_PANEL_POS,
    CALL_COLOR
  );

  const finalWorld = comparisonPanel(
    'EXPLAIN A REAL OUTCOME',
    'Repair the physical leak',
    'Leak sealed',
    'Measure the real effect with other evidence',
    WORLD_PANEL_POS,
    REPAIR_COLOR
  );

  // 48 — Prediction explanations differ from causal explanations.
  await until(S(48));
  await play(
    ...outs([
      causeNode,
      fewerCallsNode,
      urgentNode,
      leakToUrgent,
      noRepairTag
    ]),
    new M.FadeIn(finalModel.group),
    new M.FadeIn(finalWorld.group),
    new M.FadeIn(notEqual),
    ...fbox([
      ['Model explanation: why the prediction changes', CALL_COLOR],
      ['Causation: what changes the real outcome', REPAIR_COLOR]
    ], URGENT_COLOR),
    ...say('EXPLAINING PREDICTIONS IS NOT EXPLAINING CAUSES', URGENT_COLOR)
  );
}
