// lesson 16.1.2
// Partial dependence: how does one feature affect the model's predictions?
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

  const predict = (calls, pipes) =>
    calls.map((n, i) => MODEL[pipes[i]][n]);

  const total = values =>
    values.reduce((a, b) => a + b, 0);

  const mean = values =>
    total(values) / values.length;

  const ORIGINAL_RISK = predict(CALLS, PIPES);

  const TEST_CALLS = [0, 1, 2];

  const TEST_RISKS = TEST_CALLS.map(n =>
    predict(HOMES.map(() => n), PIPES)
  );

  const TOTALS = TEST_RISKS.map(total);
  const MEANS = TEST_RISKS.map(mean);

  // Original risks: [90, 10, 50, 30]
  //
  // All 0 calls: [30, 10, 10, 30]
  // Total = 80, mean = 20%
  //
  // All 1 call: [60, 30, 30, 60]
  // Total = 180, mean = 45%
  //
  // All 2 calls: [90, 50, 50, 90]
  // Total = 280, mean = 70%
  //
  // Confirmed urgency remains unchanged throughout.
  // Dispatch decisions are not part of this lesson's calculation.

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22
  // Content between y = -5.5 and y = 4.3.
  //
  // Laptop: 14.22 x 8
  // Content between y = -3.0 and y = 2.3.
  //
  // Phone: table above graph.
  // Laptop: table to the left of graph.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.25;

  const PILL = P
    ? [0, 3.85, 0]
    : [0, 1.95, 0];

  const EARLY_BOX = P
    ? [0, -2.10, 0]
    : [3.20, -0.20, 0];

  const LATE_BOX = P
    ? [0, -5.70, 0]
    : [0, -2.46, 0];

  const STATUS_Y = P ? 3.28 : 1.48;
  const HEADER_Y = P ? 2.82 : 1.02;

  const ROW_TOP = P ? 2.19 : 0.42;
  const ROW_STEP = P ? 0.72 : 0.64;
  const ROW_H = P ? 0.62 : 0.55;

  const CELL_FONT = P ? 19 : 20;
  const HEAD_FONT = P ? 16 : 17;
  const SMALL_FONT = P ? 15 : 15;

  const WIDTHS = P
    ? [1.25, 1.15, 1.55, 2.60]
    : [1.30, 1.00, 1.35, 2.15];

  const TABLE_W = WIDTHS.reduce((a, b) => a + b, 0);
  const LEFT = CX - TABLE_W / 2;

  const COL = {
    HOME: 0,
    CALLS: 1,
    PIPE: 2,
    RISK: 3
  };

  const colLeft = j =>
    LEFT + WIDTHS.slice(0, j).reduce((a, b) => a + b, 0);

  const colx = j => colLeft(j) + WIDTHS[j] / 2;
  const rowy = i => ROW_TOP - i * ROW_STEP;
  const cell = (j, i) => [colx(j), rowy(i), 0];

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

  // ------------------------------------------------------------
  // Formula box — approved reference style.
  //
  // Before the graph appears, use the open space beside or below
  // the table. Once the graph appears, use the bottom strip.
  // ------------------------------------------------------------

  let boxNow = null;
  let graphVisible = false;

  function fbox(lines, color = C.cyan) {
    const compact = graphVisible;

    const pos = compact ? LATE_BOX : EARLY_BOX;

    const size = compact
      ? (P ? 18 : 19)
      : (P ? 22 : 22);

    const lh = compact
      ? (P ? 0.28 : 0.29)
      : (P ? 0.44 : 0.42);

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

    const wd = Math.max(...widths) + 0.62;
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

    const left = pos[0] - wd / 2 + 0.31;
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
      ? (P ? FW - 0.65 : FW - 2.20)
      : (P ? FW - 0.80 : 5.65);

    const maxh = compact ? 0.90 : 2.40;

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
  // Opening picture: four homes served by a water company.
  // ------------------------------------------------------------

  function house(x, y, i) {
    const color = districtColor(i);

    const wall = new M.Rectangle({
      width: 0.86,
      height: 0.76,
      color,
      strokeWidth: 2
    });

    wall.setFill(C.card, 0.92);
    wall.moveTo([x, y, 0]);

    const roofL = line(
      [x - 0.55, y + 0.36, 0],
      [x, y + 0.88, 0],
      color,
      3
    );

    const roofR = line(
      [x, y + 0.88, 0],
      [x + 0.55, y + 0.36, 0],
      color,
      3
    );

    const door = new M.Rectangle({
      width: 0.23,
      height: 0.37,
      color,
      strokeWidth: 1.5
    });

    door.setFill(color, 0.25);
    door.moveTo([x, y - 0.19, 0]);

    const windows = [-0.25, 0.25].map(dx => {
      const w = new M.Rectangle({
        width: 0.17,
        height: 0.17,
        color,
        strokeWidth: 1
      });

      w.setFill(color, 0.65);
      w.moveTo([x + dx, y + 0.13, 0]);

      return w;
    });

    const pipe = line(
      [x - 0.43, y - 0.46, 0],
      [x + 0.43, y - 0.46, 0],
      C.cyan,
      4
    );

    const label = txt(
      `Home ${HOMES[i]}`,
      P ? 18 : 20,
      C.ink,
      [x, y - 0.77, 0]
    );

    const district = txt(
      DISTRICTS[i],
      SMALL_FONT,
      color,
      [x, y - 1.08, 0]
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

  const HOME_Y = P ? 1.40 : 0.45;
  const HOME_SP = P ? 1.65 : 2.05;

  const houses = HOMES.map((_, i) =>
    house((i - 1.5) * HOME_SP, HOME_Y, i)
  );

  const urgentTag = pill(
    'URGENT = CREW NEEDED TODAY',
    C.amber,
    P ? 18 : 19
  );

  urgentTag.moveTo([0, P ? -0.65 : -1.35, 0]);

  const callQuestion = pill(
    'CALLS → PREDICTED RISK?',
    C.cyan,
    P ? 19 : 20
  );

  callQuestion.moveTo([0, P ? -1.55 : -2.15, 0]);

  // 0 — A team visiting homes with water problems.
  await until(S(0));
  await play(
    lagIn(houses, 1.40, 0.15),
    ...say('WATER COMPANY: HOME VISITS')
  );

  // 1 — Urgent means a crew is needed today.
  await until(S(1));
  await play(
    new M.FadeIn(urgentTag),
    ...say('URGENT = A VISIT TODAY', C.amber)
  );

  // 2 — How do calls affect predictions?
  await until(S(2));
  await play(
    new M.FadeIn(callQuestion),
    ...say('HOW DO CALLS AFFECT PREDICTIONS?', C.violet)
  );

  // ------------------------------------------------------------
  // Four-home table.
  //
  // Keep A, B, C and D in fixed row order.
  // District labels remain visible throughout.
  // Call cards are cyan; pipe cards are violet.
  // Risk strips use a fixed 0–100% scale.
  // ------------------------------------------------------------

  function header(s, j, color = C.muted, dy = 0) {
    return txt(
      s,
      HEAD_FONT,
      color,
      [colx(j), HEADER_Y + dy, 0],
      false,
      WIDTHS[j] - 0.10
    );
  }

  const RISK_W = WIDTHS[COL.RISK] - 0.50;
  const RISK_H = P ? 0.13 : 0.12;

  function tableFrame() {
    const parts = [];

    for (let i = 0; i < 4; i++) {
      const bg = rect(
        TABLE_W,
        ROW_H,
        [CX, rowy(i), 0],
        C.muted,
        0,
        0.8,
        0.09
      );

      bg.setFill(C.card, i % 2 === 0 ? 0.84 : 0.52);

      const edge = line(
        [LEFT + 0.035, rowy(i) - ROW_H * 0.32, 0],
        [LEFT + 0.035, rowy(i) + ROW_H * 0.32, 0],
        districtColor(i),
        4
      );

      const home = txt(
        HOMES[i],
        P ? 22 : 22,
        C.ink,
        [colx(COL.HOME), rowy(i) + 0.11, 0],
        true
      );

      const district = txt(
        DISTRICTS[i],
        SMALL_FONT,
        districtColor(i),
        [colx(COL.HOME), rowy(i) - 0.17, 0],
        false,
        WIDTHS[COL.HOME] - 0.12
      );

      parts.push(bg, edge, home, district);
    }

    parts.push(
      header('Home', COL.HOME),
      header('Calls', COL.CALLS, C.cyan),
      header('Pipe', COL.PIPE, C.violet)
    );

    return new M.VGroup(...parts);
  }

  function riskHeader() {
    const x = colx(COL.RISK);

    const title = header(
      'Risk (%)',
      COL.RISK,
      C.cyan,
      0.11
    );

    const zero = txt(
      '0',
      15,
      C.muted,
      [x - RISK_W / 2, HEADER_Y - 0.17, 0],
      true
    );

    const hundred = txt(
      '100',
      15,
      C.muted,
      [x + RISK_W / 2, HEADER_Y - 0.17, 0],
      true
    );

    return new M.VGroup(title, zero, hundred);
  }

  function statusTag(s, color = C.cyan) {
    return txt(
      s,
      P ? 16 : 16,
      color,
      [CX, STATUS_Y, 0],
      true,
      TABLE_W - 0.20
    );
  }

  function inputCard(value, p, color, w, h) {
    const bg = rect(
      w, h, p,
      color,
      0.12,
      1.5,
      0.09
    );

    const t = txt(
      value,
      CELL_FONT,
      color,
      p,
      true,
      w - 0.10
    );

    return new M.VGroup(bg, t);
  }

  function callCard(n, p) {
    return inputCard(
      String(n),
      p,
      C.cyan,
      P ? 0.78 : 0.72,
      P ? 0.48 : 0.43
    );
  }

  function pipeCard(type, p) {
    return inputCard(
      type,
      p,
      C.violet,
      WIDTHS[COL.PIPE] - 0.18,
      P ? 0.48 : 0.43
    );
  }

  function riskCell(value, i) {
    const x = colx(COL.RISK);
    const y = rowy(i);
    const by = y - 0.14;
    const left = x - RISK_W / 2;

    const track = new M.Rectangle({
      width: RISK_W,
      height: RISK_H,
      color: C.muted,
      strokeWidth: 1
    });

    track.setFill(C.muted, 0.15);
    track.moveTo([x, by, 0]);

    const w = RISK_W * value / 100;

    const fill = new M.Rectangle({
      width: w,
      height: RISK_H,
      color: C.cyan,
      strokeWidth: 1
    });

    fill.setFill(C.cyan, 0.92);
    fill.moveTo([left + w / 2, by, 0]);

    const valueText = txt(
      `${value}%`,
      P ? 20 : 21,
      C.cyan,
      [x, y + 0.095, 0],
      true
    );

    return new M.VGroup(track, fill, valueText);
  }

  function columnOutline(first, last, color) {
    const left = colLeft(first);
    const right = colLeft(last) + WIDTHS[last];

    const top = HEADER_Y + 0.26;
    const bottom = rowy(3) - ROW_H / 2 - 0.035;

    return rect(
      right - left - 0.035,
      top - bottom,
      [(left + right) / 2, (top + bottom) / 2, 0],
      color,
      0,
      2.2,
      0.12
    );
  }

  const frame = tableFrame();

  let statusNow = statusTag(
    'ORIGINAL REQUESTS',
    C.muted
  );

  let riskHead = null;

  let callCards = Array(4).fill(null);
  let pipeCards = Array(4).fill(null);
  let riskCells = Array(4).fill(null);

  let callOutline = null;
  let pipeOutline = null;
  let featuresOutline = null;

  function changeStatus(s, color = C.cyan) {
    const next = statusTag(s, color);

    const a = [
      new M.FadeOut(statusNow),
      new M.FadeIn(next)
    ];

    statusNow = next;

    return a;
  }

  function addInputs(i) {
    callCards[i] = callCard(
      CALLS[i],
      cell(COL.CALLS, i)
    );

    pipeCards[i] = pipeCard(
      PIPES[i],
      cell(COL.PIPE, i)
    );

    return [
      new M.FadeIn(callCards[i]),
      new M.FadeIn(pipeCards[i])
    ];
  }

  function addRisk(i, value) {
    riskCells[i] = riskCell(value, i);

    return new M.FadeIn(riskCells[i]);
  }

  function clearRisks() {
    const a = outs(riskCells);

    riskCells = Array(4).fill(null);

    return a;
  }

  function setAllCalls(n) {
    return new M.LaggedStart(
      callCards.map((card, i) =>
        new M.Transform(
          card,
          callCard(n, cell(COL.CALLS, i))
        )
      ),
      { lagRatio: 0.14, runTime: 1.15 }
    );
  }

  function indicateRisks(color = C.amber) {
    return new M.LaggedStart(
      riskCells
        .filter(Boolean)
        .map(r => new M.Indicate(r, { color })),
      { lagRatio: 0.12, runTime: 1.40 }
    );
  }

  // 3 — Bring back the four homes.
  await until(S(3));
  await play(
    ...outs([...houses, urgentTag, callQuestion]),
    new M.FadeIn(frame),
    new M.FadeIn(statusNow),
    ...say('OUR FOUR HOMES')
  );

  // 4 — A: two calls, older pipe.
  await until(S(4));
  await play(
    ...addInputs(0),
    ...say('A: 2 CALLS, OLDER PIPE')
  );

  // 5 — B: zero calls, newer pipe.
  await until(S(5));
  await play(
    ...addInputs(1),
    ...say('B: 0 CALLS, NEWER PIPE')
  );

  // 6 — C: two calls, newer pipe.
  await until(S(6));
  await play(
    ...addInputs(2),
    ...say('C: 2 CALLS, NEWER PIPE')
  );

  // 7 — D: zero calls, older pipe.
  await until(S(7));
  await play(
    ...addInputs(3),
    ...say('D: 0 CALLS, OLDER PIPE')
  );

  // 8 — Features are the information used by the model.
  await until(S(8));

  featuresOutline = columnOutline(
    COL.CALLS,
    COL.PIPE,
    C.violet
  );

  await play(
    new M.Create(featuresOutline),
    ...fbox([
      ['FEATURES', C.violet],
      ['Number of calls', C.cyan],
      ['Type of pipe', C.violet],
      '        ↓',
      ['Trained model', C.green],
      '        ↓',
      ['Chance of an urgent visit', C.cyan]
    ], C.violet),
    ...say('TWO FEATURES GO INTO THE MODEL', C.violet)
  );

  // 9 — Define predicted risk.
  await until(S(9));

  riskHead = riskHeader();

  await play(
    new M.FadeOut(featuresOutline),
    new M.FadeIn(riskHead),
    ...fbox([
      ['Risk = estimated chance', C.cyan],
      'of an urgent visit'
    ]),
    ...say('RISK = ESTIMATED CHANCE')
  );

  featuresOutline = null;

  // ------------------------------------------------------------
  // Original predictions.
  // ------------------------------------------------------------

  // 10 — A: 90%.
  await until(S(10));
  await play(
    addRisk(0, ORIGINAL_RISK[0]),
    ...say('HOME A: 90% RISK')
  );

  // 11 — B: 10%.
  await until(S(11));
  await play(
    addRisk(1, ORIGINAL_RISK[1]),
    ...say('HOME B: 10% RISK')
  );

  // 12 — C: 50%.
  await until(S(12));
  await play(
    addRisk(2, ORIGINAL_RISK[2]),
    ...say('HOME C: 50% RISK')
  );

  // 13 — D: 30%.
  await until(S(13));
  await play(
    addRisk(3, ORIGINAL_RISK[3]),
    ...say('HOME D: 30% RISK')
  );

  // 14 — Both features can affect predictions.
  await until(S(14));

  callOutline = columnOutline(
    COL.CALLS,
    COL.CALLS,
    C.cyan
  );

  pipeOutline = columnOutline(
    COL.PIPE,
    COL.PIPE,
    C.violet
  );

  await play(
    new M.Create(callOutline),
    new M.Create(pipeOutline),
    ...fbox([
      ['Calls can affect risk', C.cyan],
      ['Pipe type can affect risk', C.violet],
      'Both are used by the model'
    ], C.violet),
    ...say('BOTH FEATURES CAN CHANGE THE RISK', C.violet)
  );

  // 15 — How do we study calls on their own?
  await until(S(15));
  await play(
    new M.Indicate(callOutline, { color: C.cyan }),
    ...fbox([
      ['Study one feature at a time', C.cyan],
      'Change calls',
      ['Keep pipe types fixed', C.violet]
    ]),
    ...say('HOW CAN WE STUDY CALLS ALONE?')
  );

  // ------------------------------------------------------------
  // Work on a copy of the requests.
  //
  // Never change the original records.
  // The call numbers become hypothetical model inputs.
  // Pipe types remain Older, Newer, Newer, Older.
  // ------------------------------------------------------------

  // 16 — Make a copy.
  await until(S(16));
  await play(
    ...changeStatus('COPY OF ORIGINAL REQUESTS', C.violet),
    ...fbox([
      ['Original requests saved', C.muted],
      ['Work on a separate copy', C.violet]
    ], C.violet),
    ...say('MAKE A COPY OF THE FOUR REQUESTS', C.violet)
  );

  // 17 — Give all homes the same number of calls.
  await until(S(17));
  await play(
    ...clearRisks(),
    new M.Indicate(callOutline, { color: C.cyan }),
    ...fbox([
      ['Give every home', C.cyan],
      ['the same number of calls', C.cyan],
      'Try one call value at a time'
    ]),
    ...say('SAME CALL NUMBER FOR EVERY HOME')
  );

  // 18 — Keep each home's pipe type.
  await until(S(18));
  await play(
    new M.Indicate(pipeOutline, { color: C.violet }),
    ...fbox([
      ['A: Older     B: Newer', C.violet],
      ['C: Newer     D: Older', C.violet],
      ['Pipe types never change', C.green]
    ], C.violet),
    ...say('KEEP EACH HOME’S OWN PIPE TYPE', C.green)
  );

  // 19 — Compare different homes at the same call value.
  await until(S(19));
  await play(
    new M.FadeOut(pipeOutline),
    ...fbox([
      ['Same calls for all four homes', C.cyan],
      ['Different original pipe types', C.violet],
      'Ask the same trained model'
    ]),
    ...say('SAME CALLS, DIFFERENT HOMES')
  );

  pipeOutline = null;

  // ------------------------------------------------------------
  // Experiment 1: every home gets zero calls.
  // ------------------------------------------------------------

  // 20 — Set all call values to zero.
  await until(S(20));
  await play(
    setAllCalls(0),
    ...changeStatus('COPY: EVERY HOME HAS 0 CALLS'),
    ...fbox([
      ['Calls = 0 for every home', C.cyan],
      ['Pipe types unchanged', C.violet]
    ]),
    ...say('TEST 1: EVERY HOME GETS 0 CALLS')
  );

  // 21 — A: older pipe, risk 30%.
  await until(S(21));
  await play(
    addRisk(0, TEST_RISKS[0][0]),
    ...say('A: 0 CALLS, OLDER PIPE → 30%')
  );

  // 22 — B: newer pipe, risk 10%.
  await until(S(22));
  await play(
    addRisk(1, TEST_RISKS[0][1]),
    ...say('B: 0 CALLS, NEWER PIPE → 10%')
  );

  // 23 — C: newer pipe, risk 10%.
  await until(S(23));
  await play(
    addRisk(2, TEST_RISKS[0][2]),
    ...say('C: 0 CALLS, NEWER PIPE → 10%')
  );

  // 24 — D: older pipe, risk 30%.
  await until(S(24));
  await play(
    addRisk(3, TEST_RISKS[0][3]),
    ...say('D: 0 CALLS, OLDER PIPE → 30%')
  );

  // ------------------------------------------------------------
  // Show the mean visually before calculating it.
  //
  // Four risk bars are copied into a separate picture.
  // They transform into four equal-height bars.
  // Total height is conserved.
  // ------------------------------------------------------------

  const MEAN_CX = P ? 0 : 3.20;
  const MEAN_BASE = P ? -3.50 : -1.45;

  const MEAN_SP = P ? 1.08 : 0.94;
  const MEAN_BW = P ? 0.63 : 0.56;
  const MEAN_SCALE = P ? 0.060 : 0.045;

  const meanBarX = i =>
    MEAN_CX + (i - 1.5) * MEAN_SP;

  function meanBar(v, i, color = C.cyan) {
    const x = meanBarX(i);
    const h = v * MEAN_SCALE;

    const bar = new M.Rectangle({
      width: MEAN_BW,
      height: h,
      color,
      strokeWidth: 1.5
    });

    bar.setFill(color, 0.82);
    bar.moveTo([x, MEAN_BASE + h / 2, 0]);

    return bar;
  }

  function meanBarLabel(v, i, color = C.cyan) {
    return txt(
      `${v}%`,
      P ? 18 : 18,
      color,
      [
        meanBarX(i),
        MEAN_BASE + v * MEAN_SCALE + 0.24,
        0
      ],
      true
    );
  }

  const meanBars = TEST_RISKS[0].map((v, i) =>
    meanBar(v, i)
  );

  const meanLabels = TEST_RISKS[0].map((v, i) =>
    meanBarLabel(v, i)
  );

  const meanHomes = HOMES.map((h, i) =>
    txt(
      h,
      17,
      C.muted,
      [meanBarX(i), MEAN_BASE - 0.25, 0],
      true
    )
  );

  const meanFloor = line(
    [meanBarX(0) - MEAN_SP * 0.48, MEAN_BASE, 0],
    [meanBarX(3) + MEAN_SP * 0.48, MEAN_BASE, 0],
    C.muted,
    2
  );

  const meanTitle = txt(
    'FOUR PREDICTIONS',
    P ? 20 : 20,
    C.cyan,
    [MEAN_CX, P ? -0.95 : 0.95, 0],
    false
  );

  let meanLevel = null;

  // 25 — Describe the four predictions with their mean.
  await until(S(25));
  await play(
    ...dropBox(),
    new M.FadeIn(meanTitle),
    new M.Create(meanFloor),
    ...ins(meanHomes),
    new M.LaggedStart(
      meanBars.map(b => new M.FadeIn(b)),
      { lagRatio: 0.14, runTime: 1.15 }
    ),
    ...ins(meanLabels),
    ...say('ONE NUMBER FOR THE FOUR PREDICTIONS', C.green)
  );

  // 26 — Mean is total divided by count.
  await until(S(26));

  const equalTitle = txt(
    'MEAN = ONE EQUAL SHARE',
    P ? 20 : 20,
    C.green,
    [MEAN_CX, P ? -0.95 : 0.95, 0],
    false,
    P ? 6.20 : 5.40
  );

  await play(
    new M.Transform(meanTitle, equalTitle),
    new M.Indicate(meanFloor, { color: C.green }),
    ...say('MEAN = TOTAL ÷ COUNT', C.green)
  );

  // 27 — Add the four predictions.
  await until(S(27));

  const sumNote = txt(
    '30 + 10 + 10 + 30 = 80',
    P ? 23 : 22,
    C.amber,
    [MEAN_CX, P ? -4.35 : -2.10, 0],
    true,
    P ? 6.40 : 5.50
  );

  await play(
    new M.FadeIn(sumNote),
    new M.LaggedStart(
      meanLabels.map(t =>
        new M.Indicate(t, { color: C.amber })
      ),
      { lagRatio: 0.14, runTime: 1.30 }
    ),
    ...say('ADD THE FOUR VALUES: TOTAL = 80', C.amber)
  );

  // 28 — Share the total equally: 80 / 4 = 20%.
  await until(S(28));

  const leveledY = MEAN_BASE + MEANS[0] * MEAN_SCALE;

  meanLevel = new M.DashedLine({
    start: [
      meanBarX(0) - MEAN_SP * 0.48,
      leveledY,
      0
    ],
    end: [
      meanBarX(3) + MEAN_SP * 0.48,
      leveledY,
      0
    ],
    color: C.green
  });

  const meanResult = txt(
    '80 ÷ 4 = 20%',
    P ? 25 : 24,
    C.green,
    [MEAN_CX, P ? -4.35 : -2.10, 0],
    true
  );

  await play(
    new M.LaggedStart(
      meanBars.map((b, i) =>
        new M.Transform(
          b,
          meanBar(MEANS[0], i, C.green)
        )
      ),
      { lagRatio: 0.10, runTime: 1.20 }
    ),
    ...meanLabels.map((t, i) =>
      new M.Transform(
        t,
        meanBarLabel(MEANS[0], i, C.green)
      )
    ),
    new M.Create(meanLevel),
    new M.Transform(sumNote, meanResult),
    ...say('MEAN RISK = 20%', C.green)
  );

  // ------------------------------------------------------------
  // Partial dependence graph.
  //
  // Horizontal axis: calls, 0 to 2.
  // Vertical axis: mean predicted risk, 0 to 100%.
  //
  // The horizontal scale is discrete at the three tested values.
  // The connecting line is introduced only at sentence 43.
  // ------------------------------------------------------------

  const GX0 = P ? -2.40 : 0.95;
  const GX1 = P ? 2.65 : 5.85;

  const GY0 = P ? -4.55 : -1.30;
  const GY1 = P ? -1.30 : 0.85;

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

    const xAxis = line(
      [GX0, GY0, 0],
      [GX1 + 0.18, GY0, 0],
      C.muted,
      2.5
    );

    const yAxis = line(
      [GX0, GY0, 0],
      [GX0, GY1 + 0.10, 0],
      C.muted,
      2.5
    );

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

      const tick = line(
        [GX0 - 0.07, y, 0],
        [GX0 + 0.07, y, 0],
        C.muted,
        1.6
      );

      const label = txt(
        `${v}%`,
        15,
        C.muted,
        [GX0 - 0.43, y, 0],
        true
      );

      parts.push(tick, label);
    }

    for (const n of [0, 1, 2]) {
      const x = gx(n);

      const tick = line(
        [x, GY0 - 0.07, 0],
        [x, GY0 + 0.07, 0],
        C.muted,
        1.6
      );

      const label = txt(
        String(n),
        P ? 17 : 17,
        C.ink,
        [x, GY0 - 0.20, 0],
        true
      );

      parts.push(tick, label);
    }

    parts.push(xAxis, yAxis);

    return new M.VGroup(...parts);
  }

  const axes = graphAxes();

  const graphTitle = txt(
    'Mean predicted risk (%)',
    P ? 19 : 20,
    C.ink,
    [(GX0 + GX1) / 2, GY1 + 0.34, 0],
    false,
    GRAPH_W + 0.30
  );

  const xLabel = txt(
    'Number of calls',
    P ? 18 : 18,
    C.ink,
    [(GX0 + GX1) / 2, GY0 - 0.49, 0]
  );

  function graphPoint(calls, value) {
    const p = gp(calls, value);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.20 : 0.18,
      color: C.green
    });

    halo.setFill(C.green, 0.18);

    const dot = new M.Dot({
      point: p,
      radius: P ? 0.095 : 0.090,
      color: C.green
    });

    dot.setFill(C.green, 1);

    const labelX = p[0] + (
      calls === 0 ? 0.43 :
      calls === 2 ? -0.43 :
      0
    );

    const label = txt(
      `${value}%`,
      P ? 20 : 21,
      C.green,
      [
        labelX,
        p[1] + (P ? 0.30 : 0.25),
        0
      ],
      true
    );

    return {
      group: new M.VGroup(halo, dot, label),
      dot,
      label
    };
  }

  const graphPoints = MEANS.map((v, i) =>
    graphPoint(TEST_CALLS[i], v)
  );

  // 29 — Plot zero calls, mean risk 20%.
  await until(S(29));

  graphVisible = true;

  await play(
    ...outs([
      meanTitle,
      meanFloor,
      meanLevel,
      sumNote,
      ...meanBars,
      ...meanLabels,
      ...meanHomes
    ]),
    new M.FadeIn(axes),
    new M.FadeIn(graphTitle),
    new M.FadeIn(xLabel),
    new M.FadeIn(graphPoints[0].group),
    ...fbox([
      ['0 calls → mean risk 20%', C.green]
    ], C.green),
    ...say('FIRST DOT: 0 CALLS, 20%', C.green)
  );

  // 30 — Explain the graph's two axes.
  await until(S(30));
  await play(
    new M.Indicate(xLabel, { color: C.cyan }),
    new M.Indicate(graphTitle, { color: C.green }),
    ...fbox([
      ['Across: number of calls', C.cyan],
      ['Up: mean predicted risk', C.green]
    ]),
    ...say('CALLS ACROSS, MEAN RISK UP')
  );

  // ------------------------------------------------------------
  // Experiment 2: every home gets one call.
  // ------------------------------------------------------------

  // 31 — Change calls to one; preserve pipe types.
  await until(S(31));

  pipeOutline = columnOutline(
    COL.PIPE,
    COL.PIPE,
    C.violet
  );

  await play(
    ...clearRisks(),
    setAllCalls(1),
    new M.Create(pipeOutline),
    ...changeStatus('COPY: EVERY HOME HAS 1 CALL'),
    ...fbox([
      ['Calls = 1 for every home', C.cyan],
      ['Pipe types unchanged', C.violet]
    ]),
    ...say('TEST 2: EVERY HOME GETS 1 CALL')
  );

  // 32 — A: 60%; B: 30%.
  await until(S(32));
  await play(
    addRisk(0, TEST_RISKS[1][0]),
    addRisk(1, TEST_RISKS[1][1]),
    new M.FadeOut(pipeOutline),
    ...say('A: 60%    B: 30%')
  );

  pipeOutline = null;

  // 33 — C: 30%; D: 60%.
  await until(S(33));
  await play(
    addRisk(2, TEST_RISKS[1][2]),
    addRisk(3, TEST_RISKS[1][3]),
    ...say('C: 30%    D: 60%')
  );

  // 34 — Total = 180.
  await until(S(34));
  await play(
    ...fbox([
      ['60 + 30 + 30 + 60 = 180', C.amber]
    ], C.amber),
    ...say('TOTAL = 180', C.amber)
  );

  // 35 — Mean risk = 45%.
  await until(S(35));
  await play(
    indicateRisks(C.amber),
    ...fbox([
      '60 + 30 + 30 + 60 = 180',
      ['180 ÷ 4 = 45%', C.green]
    ], C.green),
    ...say('MEAN RISK = 45%', C.green)
  );

  // 36 — Plot one call, mean risk 45%.
  await until(S(36));
  await play(
    new M.FadeIn(graphPoints[1].group),
    ...fbox([
      ['1 call → mean risk 45%', C.green]
    ], C.green),
    ...say('SECOND DOT: 1 CALL, 45%', C.green)
  );

  // ------------------------------------------------------------
  // Experiment 3: every home gets two calls.
  // ------------------------------------------------------------

  // 37 — Set all call values to two.
  await until(S(37));
  await play(
    ...clearRisks(),
    setAllCalls(2),
    ...changeStatus('COPY: EVERY HOME HAS 2 CALLS'),
    ...fbox([
      ['Calls = 2 for every home', C.cyan],
      ['Pipe types unchanged', C.violet]
    ]),
    ...say('TEST 3: EVERY HOME GETS 2 CALLS')
  );

  // 38 — A: 90%; B: 50%.
  await until(S(38));
  await play(
    addRisk(0, TEST_RISKS[2][0]),
    addRisk(1, TEST_RISKS[2][1]),
    ...say('A: 90%    B: 50%')
  );

  // 39 — C: 50%; D: 90%.
  await until(S(39));
  await play(
    addRisk(2, TEST_RISKS[2][2]),
    addRisk(3, TEST_RISKS[2][3]),
    ...say('C: 50%    D: 90%')
  );

  // 40 — Total = 280.
  await until(S(40));
  await play(
    ...fbox([
      ['90 + 50 + 50 + 90 = 280', C.amber]
    ], C.amber),
    ...say('TOTAL = 280', C.amber)
  );

  // 41 — Mean risk = 70%.
  await until(S(41));
  await play(
    indicateRisks(C.amber),
    ...fbox([
      '90 + 50 + 50 + 90 = 280',
      ['280 ÷ 4 = 70%', C.green]
    ], C.green),
    ...say('MEAN RISK = 70%', C.green)
  );

  // 42 — Plot two calls, mean risk 70%.
  await until(S(42));
  await play(
    new M.FadeIn(graphPoints[2].group),
    ...fbox([
      ['2 calls → mean risk 70%', C.green]
    ], C.green),
    ...say('THIRD DOT: 2 CALLS, 70%', C.green)
  );

  // ------------------------------------------------------------
  // Connect the three mean predictions.
  // ------------------------------------------------------------

  const segments = [
    line(
      gp(0, MEANS[0]),
      gp(1, MEANS[1]),
      C.green,
      3.5
    ),
    line(
      gp(1, MEANS[1]),
      gp(2, MEANS[2]),
      C.green,
      3.5
    )
  ];

  // 43 — Join the dots.
  await until(S(43));
  await play(
    new M.LaggedStart(
      segments.map(s => new M.Create(s)),
      { lagRatio: 0.22, runTime: 0.95 }
    ),
    ...fbox([
      ['20% → 45% → 70%', C.green]
    ], C.green),
    ...say('JOIN THE THREE MEAN PREDICTIONS', C.green)
  );

  // 44 — The line shows how the mean prediction changes.
  await until(S(44));
  await play(
    new M.LaggedStart(
      graphPoints.map(p =>
        new M.Indicate(p.group, { color: C.green })
      ),
      { lagRatio: 0.20, runTime: 1.65 }
    ),
    ...fbox([
      ['Change calls → change mean risk', C.green]
    ], C.green),
    ...say('HOW THE MEAN PREDICTION CHANGES', C.green)
  );

  // 45 — Name the partial dependence plot.
  await until(S(45));

  const plotTitle = txt(
    'Partial dependence plot',
    P ? 21 : 22,
    C.green,
    [(GX0 + GX1) / 2, GY1 + 0.68, 0],
    false,
    GRAPH_W + 0.40
  );

  // The old title "Mean predicted risk (%)" stays as the axis name;
  // the plot name goes above it (nothing sits on the 100% line).
  await play(
    new M.FadeIn(plotTitle),
    ...say('PARTIAL DEPENDENCE PLOT', C.green)
  );

  // 46 — Partial means changing only one feature.
  await until(S(46));

  pipeOutline = columnOutline(
    COL.PIPE,
    COL.PIPE,
    C.violet
  );

  await play(
    new M.Indicate(callOutline, { color: C.cyan }),
    new M.Create(pipeOutline),
    ...fbox([
      ['Change one part: calls', C.cyan],
      ['Keep the other part: pipe type', C.violet]
    ], C.violet),
    ...say('PARTIAL = CHANGE ONLY ONE FEATURE', C.violet)
  );

  // ------------------------------------------------------------
  // Formula, after the picture.
  // ------------------------------------------------------------

  // 47 — Introduce one short formula.
  await until(S(47));
  await play(
    new M.FadeOut(pipeOutline),
    ...fbox([
      ['Choose a call value', C.cyan],
      ['Predict for every home, then average', C.green]
    ]),
    ...say('ONE SHORT FORMULA')
  );

  pipeOutline = null;

  // 48 — Partial dependence is the mean of the new predictions.
  await until(S(48));
  await play(
    ...fbox([
      ['Partial dependence at a chosen value', C.cyan],
      ['= sum of new predictions ÷ count', C.green]
    ], C.green),
    ...say('PARTIAL DEPENDENCE = MEAN PREDICTION', C.green)
  );

  // 49 — The chosen feature value is the number of calls.
  await until(S(49));
  await play(
    new M.Indicate(callOutline, { color: C.cyan }),
    new M.Indicate(xLabel, { color: C.cyan }),
    ...fbox([
      ['Chosen feature value = number of calls', C.cyan],
      'Here we test 0, 1 and 2 calls'
    ]),
    ...say('FEATURE VALUE = CALL NUMBER')
  );

  // ------------------------------------------------------------
  // Interpretation.
  // ------------------------------------------------------------

  // 50 — Understand the model across a group of homes.
  await until(S(50));
  await play(
    new M.LaggedStart(
      graphPoints.map(p =>
        new M.Indicate(p.group, { color: C.green })
      ),
      { lagRatio: 0.18, runTime: 1.55 }
    ),
    ...fbox([
      ['One feature, four homes', C.cyan],
      ['One mean prediction at each value', C.green]
    ], C.green),
    ...say('HOW THE MODEL RESPONDS ACROSS HOMES', C.green)
  );

  // 51 — Mean predicted risk rises as calls increase.
  await until(S(51));

  function riseMark(from, to, xOffset) {
    const x = gx(to) + xOffset;
    const low = gy(MEANS[from]);
    const high = gy(MEANS[to]);

    const vertical = line(
      [x, low, 0],
      [x, high, 0],
      C.amber,
      2.5
    );

    const lowerTick = line(
      [x - 0.07, low, 0],
      [x + 0.07, low, 0],
      C.amber,
      2
    );

    const upperTick = line(
      [x - 0.07, high, 0],
      [x + 0.07, high, 0],
      C.amber,
      2
    );

    return new M.VGroup(
      vertical,
      lowerTick,
      upperTick
    );
  }

  const rises = [
    riseMark(0, 1, -0.22),
    riseMark(1, 2, -0.22)
  ];

  await play(
    ...ins(rises),
    ...fbox([
      ['0 calls: 20%     1 call: 45%', C.green],
      ['2 calls: 70%', C.green]
    ], C.green),
    ...say('MORE CALLS → HIGHER MEAN RISK', C.green)
  );

  // ------------------------------------------------------------
  // Limitations.
  //
  // Partial dependence changes model inputs on a copy.
  // It may create unusual or impossible feature combinations.
  // It describes model predictions, not causal effects.
  // ------------------------------------------------------------

  // 52 — Some created combinations may be unrealistic.
  await until(S(52));
  await play(
    ...outs(rises),
    ...changeStatus('HYPOTHETICAL COPIED REQUESTS', C.amber),
    ...fbox([
      ['Check whether created combinations', C.amber],
      ['could actually occur in real life', C.ink]
    ], C.amber),
    ...say('SOME COMBINATIONS MAY BE UNREALISTIC', C.amber)
  );

  // 53 — Higher predicted risk does not establish causation.
  await until(S(53));
  await play(
    new M.Indicate(callOutline, { color: C.amber }),
    ...fbox([
      ['Changing a model input', C.cyan],
      ['≠ causing a real water problem', C.amber]
    ], C.amber),
    ...say('PREDICTION DOES NOT PROVE CAUSATION', C.amber)
  );

  // ------------------------------------------------------------
  // Final summary.
  //
  // Keep the graph as the central picture.
  // Restore a clear summary status above the copied rows.
  // Highlight the fixed feature and the averaged predictions.
  // ------------------------------------------------------------

  // 54 — Change one feature, keep the others fixed, average.
  await until(S(54));

  pipeOutline = columnOutline(
    COL.PIPE,
    COL.PIPE,
    C.violet
  );

  await play(
    ...changeStatus('COPY: CHANGE CALLS, KEEP PIPES'),
    new M.Create(pipeOutline),
    new M.LaggedStart(
      graphPoints.map(p =>
        new M.Indicate(p.group, { color: C.green })
      ),
      { lagRatio: 0.18, runTime: 1.60 }
    ),
    ...fbox([
      ['Change ONE feature. Keep the others fixed.', C.cyan],
      ['Average the new predictions at each value.', C.green]
    ], C.green),
    ...say('CHANGE ONE FEATURE, THEN AVERAGE', C.green)
  );
}
