// lesson 16.1.1
// Permutation importance: which information helps the model?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API and approved reference structure.
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

  const SHUFFLED_CALLS = [0, 2, 0, 2];

  const MODEL = {
    Newer: [10, 30, 50],
    Older: [30, 60, 90]
  };

  const predict = (calls, pipes) =>
    calls.map((n, i) => MODEL[pipes[i]][n]);

  const decide = risks => risks.map(r => r >= 50);

  const wrong = decisions =>
    decisions.map((d, i) => d !== ACTUAL[i]);

  const loss = decisions =>
    100 * wrong(decisions).filter(Boolean).length / HOMES.length;

  const ORIGINAL_RISK = predict(CALLS, PIPES);
  const ORIGINAL_DECISIONS = decide(ORIGINAL_RISK);
  const ORIGINAL_WRONG = wrong(ORIGINAL_DECISIONS);
  const ORIGINAL_LOSS = loss(ORIGINAL_DECISIONS);

  const SHUFFLED_RISK = predict(SHUFFLED_CALLS, PIPES);
  const SHUFFLED_DECISIONS = decide(SHUFFLED_RISK);
  const SHUFFLED_WRONG = wrong(SHUFFLED_DECISIONS);
  const SHUFFLED_LOSS = loss(SHUFFLED_DECISIONS);

  const IMPORTANCE = SHUFFLED_LOSS - ORIGINAL_LOSS;

  const RED = C.red || '#FF647C';

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone:  8 x 14.22; content y = -5.5 ... 4.3
  // Laptop: 14.22 x 8; content y = -3.0 ... 2.3
  // ------------------------------------------------------------

  const CX = 0;

  const PILL = P
    ? [CX, 3.65, 0]
    : [CX, 1.95, 0];

  const BOXP = P
    ? [CX, -3.65, 0]
    : [CX, -2.35, 0];

  const HEADER_Y = P ? 2.40 : 1.25;
  const ROW_TOP = P ? 1.48 : 0.55;
  const ROW_STEP = P ? 1.06 : 0.68;
  const ROW_H = P ? 0.88 : 0.59;

  const CELL_FONT = P ? 18 : 20;
  const SMALL_FONT = P ? 15 : 16;
  const HEAD_FONT = P ? 15 : 17;

  const WIDTHS = P
    ? [0.95, 0.80, 1.15, 1.05, 1.50, 1.15, 0.55]
    : [1.55, 1.25, 1.65, 1.65, 2.30, 1.55, 1.00];

  const TABLE_W = WIDTHS.reduce((a, b) => a + b, 0);
  const LEFT = CX - TABLE_W / 2;

  const COL = {
    HOME: 0,
    CALLS: 1,
    PIPE: 2,
    ACTUAL: 3,
    RISK: 4,
    DECISION: 5,
    CHECK: 6
  };

  const colLeft = j =>
    LEFT + WIDTHS.slice(0, j).reduce((a, b) => a + b, 0);

  const colx = j => colLeft(j) + WIDTHS[j] / 2;
  const rowy = i => ROW_TOP - i * ROW_STEP;

  const cell = (j, i) => [colx(j), rowy(i), 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

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

  function rect(w, h, p, color, fill = 0, stroke = 2, radius = 0.12) {
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

  function lagIn(objects, runTime = 1.0, lagRatio = 0.10) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box, following the approved reference.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 20;
    const lh = P ? 0.43 : 0.33;

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

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.32;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.16 - lh / 2;

    texts.forEach((t, i) => {
      const s = rows[i][0];
      const ind = cw * (s.length - s.trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.70 : FW - 2.0;

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

  function dropBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Opening picture: homes and water-company requests.
  // ------------------------------------------------------------

  function house(x, y, name, color = C.cyan) {
    const wall = new M.Rectangle({
      width: 0.86,
      height: 0.76,
      color,
      strokeWidth: 2
    });

    wall.setFill(C.card, 0.90);
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

    const windowL = new M.Rectangle({
      width: 0.17,
      height: 0.17,
      color,
      strokeWidth: 1
    });

    windowL.setFill(color, 0.60);
    windowL.moveTo([x - 0.25, y + 0.13, 0]);

    const windowR = new M.Rectangle({
      width: 0.17,
      height: 0.17,
      color,
      strokeWidth: 1
    });

    windowR.setFill(color, 0.60);
    windowR.moveTo([x + 0.25, y + 0.13, 0]);

    const pipe = line(
      [x - 0.43, y - 0.46, 0],
      [x + 0.43, y - 0.46, 0],
      C.cyan,
      4
    );

    const label = txt(
      `Home ${name}`,
      P ? 17 : 19,
      C.ink,
      [x, y - 0.79, 0]
    );

    return new M.VGroup(
      wall, roofL, roofR, door,
      windowL, windowR, pipe, label
    );
  }

  const HOME_Y = P ? 1.20 : 0.45;
  const HOME_SP = P ? 1.65 : 2.10;

  const houses = HOMES.map((h, i) =>
    house((i - 1.5) * HOME_SP, HOME_Y, h)
  );

  const urgentIntro = pill(
    'URGENT = CREW NEEDED TODAY',
    C.amber,
    P ? 18 : 19
  );

  urgentIntro.moveTo([0, P ? -0.65 : -1.12, 0]);

  function modelCard(p) {
    const w = P ? 4.75 : 5.20;
    const h = P ? 1.20 : 1.05;

    const bg = rect(w, h, p, C.violet, 0, 2);
    bg.setFill(C.card, 0.95);

    const title = txt(
      'TRAINED MODEL',
      P ? 24 : 23,
      C.violet,
      [p[0], p[1] + 0.23, 0],
      false,
      w - 0.35
    );

    const subtitle = txt(
      'Estimates the chance of an urgent visit',
      P ? 17 : 18,
      C.ink,
      [p[0], p[1] - 0.23, 0],
      false,
      w - 0.35
    );

    return new M.VGroup(bg, title, subtitle);
  }

  const openingModel = modelCard([
    0, P ? -0.90 : -1.14, 0
  ]);

  const inputCalls = pill('NUMBER OF CALLS', C.cyan, 18);
  inputCalls.moveTo([
    P ? -1.70 : -2.10,
    P ? -2.10 : -2.13,
    0
  ]);

  const inputPipe = pill('TYPE OF PIPE', C.violet, 18);
  inputPipe.moveTo([
    P ? 1.70 : 2.10,
    P ? -2.10 : -2.13,
    0
  ]);

  // 0 — Water company and homes.
  await until(S(0));
  await play(
    lagIn(houses, 1.4, 0.15),
    ...say('WATER COMPANY: HOME REQUESTS')
  );

  // 1 — Urgent visits.
  await until(S(1));
  await play(
    new M.FadeIn(urgentIntro),
    ...say('SOME VISITS CANNOT WAIT', C.amber)
  );

  // 2 — Which homes first?
  await until(S(2));
  await play(
    new M.LaggedStart(
      houses.map(h => new M.Indicate(h, { color: C.amber })),
      { lagRatio: 0.12, runTime: 1.35 }
    ),
    ...say('WHICH HOMES SHOULD WE VISIT FIRST?', C.amber)
  );

  // 3 — Introduce the model.
  await until(S(3));
  await play(
    new M.FadeOut(urgentIntro),
    new M.FadeIn(openingModel),
    ...say('A MODEL HELPS US DECIDE', C.violet)
  );

  // 4 — The two pieces of information.
  await until(S(4));
  await play(
    new M.FadeIn(inputCalls),
    new M.FadeIn(inputPipe),
    ...say('TWO PIECES OF INFORMATION')
  );

  // ------------------------------------------------------------
  // Audit table.
  //
  // Homes always remain in A, B, C, D row order.
  // Calls and pipe cards are editable inputs.
  // Crew findings are separate from dispatch decisions.
  // ------------------------------------------------------------

  function header(s, j, color = C.muted, dy = 0) {
    return txt(
      s,
      HEAD_FONT,
      color,
      [colx(j), HEADER_Y + dy, 0],
      false,
      WIDTHS[j] - 0.09
    );
  }

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
        [LEFT + 0.035, rowy(i) - ROW_H * 0.31, 0],
        [LEFT + 0.035, rowy(i) + ROW_H * 0.31, 0],
        districtColor(i),
        4
      );

      const home = txt(
        HOMES[i],
        P ? 23 : 22,
        C.ink,
        [colx(COL.HOME), rowy(i) + 0.11, 0],
        true
      );

      const district = txt(
        DISTRICTS[i],
        SMALL_FONT,
        districtColor(i),
        [colx(COL.HOME), rowy(i) - 0.18, 0],
        false,
        WIDTHS[COL.HOME] - 0.12
      );

      parts.push(bg, edge, home, district);
    }

    parts.push(
      header('Home', COL.HOME),
      header('Calls', COL.CALLS, C.cyan),
      header('Pipe', COL.PIPE, C.violet),

      header('Crew', COL.ACTUAL, C.green, 0.13),
      header('Urgent?', COL.ACTUAL, C.muted, -0.12),

      header('Risk (%)', COL.RISK, C.cyan, 0.13),

      header('Model', COL.DECISION, C.amber, 0.13),
      header('Decision', COL.DECISION, C.muted, -0.12),

      header(P ? 'OK?' : 'Match', COL.CHECK)
    );

    const rw = WIDTHS[COL.RISK] - 0.35;
    const rx = colx(COL.RISK);

    parts.push(
      txt(
        '0',
        15,
        C.muted,
        [rx - rw / 2, HEADER_Y - (P ? 0.32 : 0.20), 0],
        true
      ),
      txt(
        '100',
        15,
        C.muted,
        [rx + rw / 2, HEADER_Y - (P ? 0.32 : 0.20), 0],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  function inputCard(value, p, color, w, h) {
    const bg = rect(w, h, p, color, 0.12, 1.5, 0.09);

    const t = txt(
      value,
      CELL_FONT,
      color,
      p,
      true,
      w - 0.08
    );

    return new M.VGroup(bg, t);
  }

  function callCard(n, p) {
    return inputCard(
      String(n),
      p,
      C.cyan,
      P ? 0.66 : 0.85,
      P ? 0.57 : 0.46
    );
  }

  function pipeCard(type, p) {
    return inputCard(
      type,
      p,
      C.violet,
      WIDTHS[COL.PIPE] - 0.15,
      P ? 0.57 : 0.46
    );
  }

  function actualCell(i) {
    const p = cell(COL.ACTUAL, i);

    return txt(
      ACTUAL[i] ? 'YES' : 'NO',
      CELL_FONT,
      ACTUAL[i] ? C.green : C.muted,
      p,
      true,
      WIDTHS[COL.ACTUAL] - 0.10
    );
  }

  const RISK_W = WIDTHS[COL.RISK] - 0.35;
  const RISK_H = P ? 0.14 : 0.12;

  function riskCell(value, i) {
    const x = colx(COL.RISK);
    const y = rowy(i);
    const by = y - 0.15;
    const left = x - RISK_W / 2;

    const track = new M.Rectangle({
      width: RISK_W,
      height: RISK_H,
      color: C.muted,
      strokeWidth: 1
    });

    track.setFill(C.muted, 0.18);
    track.moveTo([x, by, 0]);

    const fw = RISK_W * value / 100;

    const fill = new M.Rectangle({
      width: fw,
      height: RISK_H,
      color: C.cyan,
      strokeWidth: 1
    });

    fill.setFill(C.cyan, 0.90);
    fill.moveTo([left + fw / 2, by, 0]);

    const valueText = txt(
      `${value}%`,
      P ? 20 : 21,
      C.cyan,
      [x, y + 0.105, 0],
      true
    );

    return new M.VGroup(track, fill, valueText);
  }

  function thresholdMark(i) {
    const x = colx(COL.RISK);
    const y = rowy(i) - 0.15;

    return line(
      [x, y - RISK_H / 2 - 0.055, 0],
      [x, y + RISK_H / 2 + 0.055, 0],
      C.amber,
      2.5
    );
  }

  function decisionCell(today, i) {
    const p = cell(COL.DECISION, i);
    const color = today ? C.amber : C.muted;

    const bg = rect(
      WIDTHS[COL.DECISION] - 0.13,
      P ? 0.50 : 0.43,
      p,
      color,
      today ? 0.14 : 0.04,
      1.4,
      0.10
    );

    const t = txt(
      today ? 'TODAY' : 'WAIT',
      P ? 16 : 17,
      color,
      p,
      true,
      WIDTHS[COL.DECISION] - 0.19
    );

    return new M.VGroup(bg, t);
  }

  function checkCell(isWrong, i) {
    return txt(
      isWrong ? '×' : '✓',
      P ? 25 : 27,
      isWrong ? RED : C.green,
      cell(COL.CHECK, i),
      false,
      WIDTHS[COL.CHECK] - 0.09
    );
  }

  function rowOutline(i, color = RED) {
    return rect(
      TABLE_W + 0.04,
      ROW_H + 0.04,
      [CX, rowy(i), 0],
      color,
      0,
      2.5,
      0.10
    );
  }

  function columnOutline(first, last, color) {
    const left = colLeft(first);
    const right = colLeft(last) + WIDTHS[last];

    const top = HEADER_Y + 0.31;
    const bottom = rowy(3) - ROW_H / 2 - 0.04;

    return rect(
      right - left - 0.025,
      top - bottom,
      [(left + right) / 2, (top + bottom) / 2, 0],
      color,
      0,
      2.2,
      0.12
    );
  }

  let frame = tableFrame();

  let callCards = Array(4).fill(null);
  let pipeCards = Array(4).fill(null);
  let actualCells = Array(4).fill(null);
  let riskCells = Array(4).fill(null);
  let decisionCells = Array(4).fill(null);
  let checkCells = Array(4).fill(null);
  let thresholds = Array(4).fill(null);

  let rowOutlines = [];
  let featureOutline = null;
  let fixedOutline = null;

  function addInputs(i) {
    callCards[i] = callCard(CALLS[i], cell(COL.CALLS, i));
    pipeCards[i] = pipeCard(PIPES[i], cell(COL.PIPE, i));

    return [
      new M.FadeIn(callCards[i]),
      new M.FadeIn(pipeCards[i])
    ];
  }

  function addActual(i) {
    actualCells[i] = actualCell(i);
    return new M.FadeIn(actualCells[i]);
  }

  function addRisk(i, value, withThreshold = false) {
    riskCells[i] = riskCell(value, i);

    const a = [new M.FadeIn(riskCells[i])];

    if (withThreshold) {
      thresholds[i] = thresholdMark(i);
      a.push(new M.Create(thresholds[i]));
    }

    return a;
  }

  function addDecision(i, value) {
    decisionCells[i] = decisionCell(value, i);
    return new M.FadeIn(decisionCells[i]);
  }

  function addCheck(i, value) {
    checkCells[i] = checkCell(value, i);
    return new M.FadeIn(checkCells[i]);
  }

  function clearPredictions() {
    const a = outs([
      ...riskCells,
      ...decisionCells,
      ...checkCells,
      ...thresholds,
      ...rowOutlines
    ]);

    riskCells = Array(4).fill(null);
    decisionCells = Array(4).fill(null);
    checkCells = Array(4).fill(null);
    thresholds = Array(4).fill(null);
    rowOutlines = [];

    return a;
  }

  function clearTable() {
    const a = outs([
      frame,
      ...callCards,
      ...pipeCards,
      ...actualCells,
      ...riskCells,
      ...decisionCells,
      ...checkCells,
      ...thresholds,
      ...rowOutlines,
      featureOutline,
      fixedOutline
    ]);

    frame = null;
    callCards = Array(4).fill(null);
    pipeCards = Array(4).fill(null);
    actualCells = Array(4).fill(null);
    riskCells = Array(4).fill(null);
    decisionCells = Array(4).fill(null);
    checkCells = Array(4).fill(null);
    thresholds = Array(4).fill(null);

    rowOutlines = [];
    featureOutline = null;
    fixedOutline = null;

    return a;
  }

  // 5 — Four past requests.
  await until(S(5));
  await play(
    ...outs([...houses, openingModel, inputCalls, inputPipe]),
    new M.FadeIn(frame),
    ...say('4 REQUESTS FROM THE PAST')
  );

  // 6 — These requests were held out from training.
  await until(S(6));
  await play(
    ...fbox([
      ['4 separate requests', C.cyan],
      ['Not used to train the model', C.muted]
    ]),
    ...say('SET ASIDE FOR TESTING', C.violet)
  );

  // 7 — Home A: two calls, older pipe.
  await until(S(7));
  await play(
    ...addInputs(0),
    ...say('A: 2 CALLS, OLDER PIPE')
  );

  // 8 — Home B: zero calls, newer pipe.
  await until(S(8));
  await play(
    ...addInputs(1),
    ...say('B: 0 CALLS, NEWER PIPE')
  );

  // 9 — Home C: two calls, newer pipe.
  await until(S(9));
  await play(
    ...addInputs(2),
    ...say('C: 2 CALLS, NEWER PIPE')
  );

  // 10 — Home D: zero calls, older pipe.
  await until(S(10));
  await play(
    ...addInputs(3),
    ...say('D: 0 CALLS, OLDER PIPE')
  );

  // ------------------------------------------------------------
  // Confirmed urgency.
  // ------------------------------------------------------------

  // 11 — Crews later inspect the homes.
  await until(S(11));

  fixedOutline = columnOutline(
    COL.ACTUAL, COL.ACTUAL, C.green
  );

  await play(
    new M.Create(fixedOutline),
    ...fbox([
      ['Later inspection', C.green],
      'What really happened'
    ], C.green),
    ...say('CREWS CHECK WHAT REALLY HAPPENED', C.green)
  );

  // 12 — A, C and D really need urgent visits.
  await until(S(12));
  await play(
    addActual(0),
    addActual(2),
    addActual(3),
    ...say('A, C AND D REALLY WERE URGENT', C.green)
  );

  // 13 — B is not urgent.
  await until(S(13));
  await play(
    addActual(1),
    new M.FadeOut(fixedOutline),
    ...say('B DID NOT NEED AN URGENT VISIT', C.muted)
  );

  fixedOutline = null;

  // ------------------------------------------------------------
  // Original model predictions.
  // ------------------------------------------------------------

  // 14 — Ask the model for predictions.
  await until(S(14));

  featureOutline = columnOutline(
    COL.CALLS, COL.PIPE, C.violet
  );

  await play(
    new M.Create(featureOutline),
    ...fbox([
      ['Calls + pipe type', C.violet],
      ['Same trained model → prediction', C.cyan]
    ], C.violet),
    ...say('WHAT DOES THE MODEL PREDICT?', C.violet)
  );

  // 15 — Define risk.
  await until(S(15));
  await play(
    new M.FadeOut(featureOutline),
    ...fbox([
      ['Risk', C.cyan],
      'Estimated chance of an urgent visit'
    ]),
    ...say('RISK = ESTIMATED CHANCE')
  );

  featureOutline = null;

  // 16 — Percent means out of 100.
  await until(S(16));
  await play(
    ...fbox([
      ['Percent (%)', C.cyan],
      'Out of 100'
    ]),
    ...say('PERCENT = OUT OF 100')
  );

  // 17 — A: 90%.
  await until(S(17));
  await play(
    ...addRisk(0, ORIGINAL_RISK[0]),
    ...say('HOME A: 90% RISK')
  );

  // 18 — B: 10%.
  await until(S(18));
  await play(
    ...addRisk(1, ORIGINAL_RISK[1]),
    ...say('HOME B: 10% RISK')
  );

  // 19 — C: 50%.
  await until(S(19));
  await play(
    ...addRisk(2, ORIGINAL_RISK[2]),
    ...say('HOME C: 50% RISK')
  );

  // 20 — D: 30%.
  await until(S(20));
  await play(
    ...addRisk(3, ORIGINAL_RISK[3]),
    ...say('HOME D: 30% RISK')
  );

  // ------------------------------------------------------------
  // Dispatch rule and original decisions.
  // ------------------------------------------------------------

  // 21 — Risk >= 50% means today's list.
  await until(S(21));

  thresholds = HOMES.map((_, i) => thresholdMark(i));

  await play(
    new M.LaggedStart(
      thresholds.map(t => new M.Create(t)),
      { lagRatio: 0.10, runTime: 1.0 }
    ),
    ...fbox([
      ['Risk ≥ 50%  →  TODAY', C.amber],
      ['Risk < 50%  →  WAIT', C.muted]
    ], C.amber),
    ...say('OUR CUTOFF IS 50%', C.amber)
  );

  // 22 — A and C go on today's list.
  await until(S(22));
  await play(
    addDecision(0, ORIGINAL_DECISIONS[0]),
    addDecision(2, ORIGINAL_DECISIONS[2]),
    ...say('TODAY: A AND C', C.amber)
  );

  // 23 — B and D wait.
  await until(S(23));
  await play(
    addDecision(1, ORIGINAL_DECISIONS[1]),
    addDecision(3, ORIGINAL_DECISIONS[3]),
    ...say('WAIT: B AND D', C.muted)
  );

  // 24 — Compare decisions with crew findings.
  await until(S(24));
  await play(
    addCheck(0, ORIGINAL_WRONG[0]),
    addCheck(1, ORIGINAL_WRONG[1]),
    addCheck(2, ORIGINAL_WRONG[2]),
    ...fbox([
      ['Compare each decision', C.cyan],
      'Crew finding versus model decision'
    ]),
    ...say('DID THE MODEL GET IT RIGHT?')
  );

  // 25 — Only Home D is wrong.
  await until(S(25));

  const missedD = rowOutline(3, RED);
  rowOutlines.push(missedD);

  await play(
    addCheck(3, ORIGINAL_WRONG[3]),
    new M.Create(missedD),
    ...fbox([
      ['Home D: confirmed urgent', C.green],
      ['Model decision: WAIT', C.muted],
      ['One missed urgent visit', RED]
    ], RED),
    ...say('ONE WRONG DECISION: HOME D', RED)
  );

  // 26 — One wrong decision out of four = 25%.
  await until(S(26));
  await play(
    ...fbox([
      ['Wrong decisions: 1', RED],
      'Total decisions: 4',
      ['1 out of 4 = 25%', C.amber]
    ], C.amber),
    ...say('1 WRONG OUT OF 4 = 25%', C.amber)
  );

  // 27 — Define loss.
  await until(S(27));
  await play(
    ...fbox([
      ['Original loss', C.cyan],
      ['1 out of 4 = 25%', C.amber]
    ]),
    ...say('LOSS = SHARE OF WRONG DECISIONS')
  );

  // ------------------------------------------------------------
  // Shuffle the calls, leaving everything else fixed.
  // ------------------------------------------------------------

  // 28 — How useful is the number of calls?
  await until(S(28));

  featureOutline = columnOutline(
    COL.CALLS, COL.CALLS, C.cyan
  );

  await play(
    ...clearPredictions(),
    new M.Create(featureOutline),
    ...fbox([
      ['Original loss saved: 25%', C.amber],
      'Test the number of calls'
    ]),
    ...say('HOW MUCH DO THE CALLS HELP?', C.violet)
  );

  // 29 — The four call cards.
  await until(S(29));
  await play(
    new M.LaggedStart(
      callCards.map(c => new M.Indicate(c, { color: C.cyan })),
      { lagRatio: 0.13, runTime: 1.6 }
    ),
    ...say('FOUR CARDS: 2, 0, 2, 0')
  );

  // Each source card retains its original number.
  // Source B goes to A, source A goes to B,
  // source D goes to C, source C goes to D.

  const sourceCards = callCards.slice();
  const MIX_ORDER = [1, 0, 3, 2];

  const STAGE_SP = P ? 1.25 : 1.40;
  const STAGE_Y = P ? -3.65 : -2.35;

  const stageSlot = k => [
    (k - 1.5) * STAGE_SP,
    STAGE_Y,
    0
  ];

  // 30 — Lift and mix the existing cards.
  await until(S(30));
  await play(
    ...dropBox(),
    new M.FadeOut(featureOutline),
    new M.LaggedStart(
      MIX_ORDER.map((source, k) =>
        new M.Transform(
          sourceCards[source],
          callCard(CALLS[source], stageSlot(k)),
          { pathArc: source % 2 === 0 ? -0.65 : 0.65 }
        )
      ),
      { lagRatio: 0.10, runTime: 1.8 }
    ),
    ...say('MIX THE EXISTING CALL CARDS', C.amber)
  );

  featureOutline = null;

  // 31 — A receives B's zero; B receives A's two.
  await until(S(31));
  await play(
    new M.LaggedStart([
      new M.Transform(
        sourceCards[1],
        callCard(0, cell(COL.CALLS, 0)),
        { pathArc: -0.45 }
      ),
      new M.Transform(
        sourceCards[0],
        callCard(2, cell(COL.CALLS, 1)),
        { pathArc: 0.45 }
      )
    ], { lagRatio: 0.18, runTime: 1.5 }),
    ...say('A GETS 0; B GETS 2')
  );

  // 32 — C receives D's zero; D receives C's two.
  await until(S(32));
  await play(
    new M.LaggedStart([
      new M.Transform(
        sourceCards[3],
        callCard(0, cell(COL.CALLS, 2)),
        { pathArc: -0.45 }
      ),
      new M.Transform(
        sourceCards[2],
        callCard(2, cell(COL.CALLS, 3)),
        { pathArc: 0.45 }
      )
    ], { lagRatio: 0.18, runTime: 1.5 }),
    ...say('C GETS 0; D GETS 2')
  );

  callCards = [
    sourceCards[1],
    sourceCards[0],
    sourceCards[3],
    sourceCards[2]
  ];

  // 33 — Only edit our copy of the data.
  await until(S(33));

  featureOutline = columnOutline(
    COL.CALLS, COL.CALLS, C.cyan
  );

  await play(
    new M.Create(featureOutline),
    ...fbox([
      ['AUDIT COPY ONLY', C.violet],
      'Original requests remain unchanged'
    ], C.violet),
    ...say('ONLY CHANGE THE COPIED CALL NUMBERS')
  );

  // 34 — Keep pipes and confirmed urgency unchanged.
  await until(S(34));

  fixedOutline = columnOutline(
    COL.PIPE, COL.ACTUAL, C.green
  );

  await play(
    new M.Create(fixedOutline),
    ...fbox([
      ['Calls: shuffled', C.cyan],
      ['Pipe types: unchanged', C.violet],
      ['Crew findings: unchanged', C.green]
    ], C.green),
    ...say('KEEP THE OTHER INFORMATION FIXED', C.green)
  );

  // 35 — Define a permutation.
  await until(S(35));
  await play(
    new M.Indicate(featureOutline, { color: C.amber }),
    ...fbox([
      ['Before: 2, 0, 2, 0', C.muted],
      ['After:  0, 2, 0, 2', C.cyan],
      'Same numbers, different order'
    ], C.amber),
    ...say('SHUFFLING = A PERMUTATION', C.amber)
  );

  // 36 — Define feature.
  await until(S(36));
  await play(
    new M.FadeOut(fixedOutline),
    ...fbox([
      ['Feature = information the model uses', C.violet],
      ['Calls', C.cyan],
      ['Pipe type', C.violet]
    ], C.violet),
    ...say('EACH MODEL INPUT IS A FEATURE', C.violet)
  );

  fixedOutline = null;

  // 37 — Define permutation importance visually.
  await until(S(37));
  await play(
    ...fbox([
      ['Shuffle ONE feature', C.cyan],
      'Ask the same model again',
      ['See how much the loss increases', C.amber]
    ]),
    ...say('PERMUTATION IMPORTANCE', C.violet)
  );

  // ------------------------------------------------------------
  // Predictions using the shuffled call numbers.
  // ------------------------------------------------------------

  // 38 — Ask the same trained model again.
  await until(S(38));

  thresholds = HOMES.map((_, i) => thresholdMark(i));

  await play(
    new M.FadeOut(featureOutline),
    ...fbox([
      ['Same trained model', C.violet],
      ['Same decision cutoff: 50%', C.amber],
      'Only the call numbers changed'
    ], C.violet),
    ...say('PREDICT AGAIN: NO RETRAINING', C.violet)
  );

  featureOutline = null;

  function addShuffledPrediction(i) {
    riskCells[i] = riskCell(SHUFFLED_RISK[i], i);
    decisionCells[i] = decisionCell(SHUFFLED_DECISIONS[i], i);

    return [
      new M.FadeIn(riskCells[i]),
      new M.Create(thresholds[i]),
      new M.FadeIn(decisionCells[i])
    ];
  }

  // 39 — A: 30%, wait.
  await until(S(39));
  await play(
    ...addShuffledPrediction(0),
    ...say('A: 30% → WAIT', C.cyan)
  );

  // 40 — B: 50%, today.
  await until(S(40));
  await play(
    ...addShuffledPrediction(1),
    ...say('B: 50% → TODAY', C.amber)
  );

  // 41 — C: 10%, wait.
  await until(S(41));
  await play(
    ...addShuffledPrediction(2),
    ...say('C: 10% → WAIT', C.cyan)
  );

  // 42 — D: 90%, today.
  await until(S(42));
  await play(
    ...addShuffledPrediction(3),
    ...say('D: 90% → TODAY', C.amber)
  );

  // 43 — A, B and C are wrong.
  await until(S(43));

  rowOutlines = [0, 1, 2].map(i => rowOutline(i, RED));

  await play(
    ...HOMES.map((_, i) => addCheck(i, SHUFFLED_WRONG[i])),
    new M.LaggedStart(
      rowOutlines.map(o => new M.Create(o)),
      { lagRatio: 0.12, runTime: 1.2 }
    ),
    ...fbox([
      ['A: missed urgent visit', RED],
      ['B: unnecessary urgent visit', RED],
      ['C: missed urgent visit', RED]
    ], RED),
    ...say('THREE WRONG DECISIONS', RED)
  );

  // 44 — Three wrong out of four = 75%.
  await until(S(44));
  await play(
    ...fbox([
      ['Wrong decisions: 3', RED],
      'Total decisions: 4',
      ['3 out of 4 = 75%', C.amber]
    ], C.amber),
    ...say('SHUFFLED LOSS = 75%', C.amber)
  );

  // ------------------------------------------------------------
  // Compare original loss with shuffled loss.
  //
  // The same scale is used for both bars.
  // The difference is measured in percentage points.
  // ------------------------------------------------------------

  const BAR_W = P ? 5.35 : 7.20;
  const BAR_H = P ? 0.51 : 0.39;
  const BAR_LEFT = -BAR_W / 2 - 0.32;

  const ORIGINAL_Y = P ? 1.58 : 1.00;
  const SHUFFLED_Y = P ? -0.24 : -0.20;

  const lossX = v => BAR_LEFT + BAR_W * v / 100;

  function lossBar(label, value, y, color, errors) {
    const track = new M.Rectangle({
      width: BAR_W,
      height: BAR_H,
      color: C.muted,
      strokeWidth: 1.5
    });

    track.setFill(C.muted, 0.13);
    track.moveTo([BAR_LEFT + BAR_W / 2, y, 0]);

    const w = BAR_W * value / 100;

    const glow = new M.Rectangle({
      width: w,
      height: BAR_H + 0.08,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, 0.12);
    glow.moveTo([BAR_LEFT + w / 2, y, 0]);

    const fill = new M.Rectangle({
      width: w,
      height: BAR_H,
      color,
      strokeWidth: 1.5
    });

    fill.setFill(color, 0.86);
    fill.moveTo([BAR_LEFT + w / 2, y, 0]);

    const title = T(label, P ? 22 : 21, C.ink);
    title.moveTo([
      BAR_LEFT + title.getWidth() / 2,
      y + (P ? 0.58 : 0.42),
      0
    ]);

    const val = txt(
      `${value}%`,
      P ? 27 : 26,
      color,
      [BAR_LEFT + BAR_W + 0.63, y, 0],
      true
    );

    const zero = txt(
      '0%',
      15,
      C.muted,
      [BAR_LEFT, y - BAR_H / 2 - 0.23, 0],
      true
    );

    const hundred = txt(
      '100%',
      15,
      C.muted,
      [BAR_LEFT + BAR_W, y - BAR_H / 2 - 0.23, 0],
      true
    );

    const mistakes = T(
      `${errors} wrong out of 4`,
      P ? 17 : 17,
      color
    );

    mistakes.moveTo([
      BAR_LEFT + BAR_W - mistakes.getWidth() / 2,
      y + (P ? 0.58 : 0.42),
      0
    ]);

    return new M.VGroup(
      track, glow, fill,
      title, val, zero, hundred, mistakes
    );
  }

  const originalBar = lossBar(
    'Original loss',
    ORIGINAL_LOSS,
    ORIGINAL_Y,
    C.cyan,
    1
  );

  const shuffledBar = lossBar(
    'Loss after shuffling calls',
    SHUFFLED_LOSS,
    SHUFFLED_Y,
    RED,
    3
  );

  // 45 — Compare 25% with 75%.
  await until(S(45));
  await play(
    ...clearTable(),
    ...dropBox(),
    new M.LaggedStart([
      new M.FadeIn(originalBar),
      new M.FadeIn(shuffledBar)
    ], { lagRatio: 0.18, runTime: 1.4 }),
    ...say('THE LOSS INCREASED', C.amber)
  );

  // 46 — Measure the difference on the shared scale.
  const DIFF_Y = P ? -1.32 : -0.92;

  const diffLeft = lossX(ORIGINAL_LOSS);
  const diffRight = lossX(SHUFFLED_LOSS);

  const diffLine = line(
    [diffLeft, DIFF_Y, 0],
    [diffRight, DIFF_Y, 0],
    C.amber,
    3
  );

  const diffTickL = line(
    [diffLeft, DIFF_Y - 0.10, 0],
    [diffLeft, DIFF_Y + 0.10, 0],
    C.amber,
    3
  );

  const diffTickR = line(
    [diffRight, DIFF_Y - 0.10, 0],
    [diffRight, DIFF_Y + 0.10, 0],
    C.amber,
    3
  );

  const diffLabel = txt(
    '+50 percentage points',
    P ? 24 : 21,
    C.amber,
    [(diffLeft + diffRight) / 2, DIFF_Y - 0.33, 0],
    false,
    BAR_W
  );

  const difference = new M.VGroup(
    diffLine, diffTickL, diffTickR, diffLabel
  );

  await until(S(46));
  await play(
    new M.FadeIn(difference),
    ...fbox([
      ['75% − 25% = 50 percentage points', C.amber]
    ], C.amber),
    ...say('THE INCREASE IS 50 PERCENTAGE POINTS', C.amber)
  );

  // ------------------------------------------------------------
  // Formulas, after the visual explanation.
  // ------------------------------------------------------------

  // 47 — Introduce the two formulas.
  await until(S(47));
  await play(
    ...fbox([
      ['Two short formulas', C.cyan],
      '1. Find the loss',
      '2. Find the increase in loss'
    ]),
    ...say('TWO STEPS IN TWO FORMULAS')
  );

  // 48 — Loss = wrong decisions / total decisions.
  await until(S(48));
  await play(
    ...fbox([
      ['loss = wrong decisions ÷ total decisions', C.ink],
      ['original: 1 ÷ 4 = 25%', C.cyan],
      ['shuffled: 3 ÷ 4 = 75%', RED]
    ]),
    ...say('LOSS = WRONG ÷ TOTAL')
  );

  // 49 — Permutation importance = shuffled loss − original loss.
  await until(S(49));
  await play(
    ...fbox([
      ['loss = wrong decisions ÷ total decisions', C.ink],
      ['importance = shuffled loss − original loss', C.violet],
      ['75% − 25% = 50 percentage points', C.amber]
    ], C.violet),
    ...say('IMPORTANCE = INCREASE IN LOSS', C.violet)
  );

  // 50 — Discover which features the trained model depends on.
  await until(S(50));
  await play(
    new M.Indicate(difference, { color: C.amber }),
    ...fbox([
      ['Calls: +50 percentage points', C.amber],
      'The model made more mistakes',
      'when the call information was mixed'
    ], C.amber),
    ...say('THE MODEL RELIES ON CALL INFORMATION', C.green)
  );

  // ------------------------------------------------------------
  // Test a different feature.
  //
  // First restore the original data.
  // Then exchange the pipe cards while keeping calls and
  // confirmed urgency fixed. No unrequested loss is asserted.
  // ------------------------------------------------------------

  // 51 — Restore original data and shuffle the pipe types.
  await until(S(51));

  frame = tableFrame();

  callCards = HOMES.map((_, i) =>
    callCard(CALLS[i], cell(COL.CALLS, i))
  );

  pipeCards = HOMES.map((_, i) =>
    pipeCard(PIPES[i], cell(COL.PIPE, i))
  );

  actualCells = HOMES.map((_, i) => actualCell(i));

  await play(
    new M.FadeOut(originalBar),
    new M.FadeOut(shuffledBar),
    new M.FadeOut(difference),
    ...dropBox(),
    new M.FadeIn(frame),
    ...ins([...callCards, ...pipeCards, ...actualCells]),
    ...say('FIRST RESTORE THE ORIGINAL DATA', C.green)
  );

  featureOutline = columnOutline(
    COL.PIPE, COL.PIPE, C.violet
  );

  const pipeSources = pipeCards.slice();
  const PIPE_ORDER = [1, 0, 3, 2];

  await play(
    new M.Create(featureOutline),
    new M.LaggedStart(
      PIPE_ORDER.map((source, destination) =>
        new M.Transform(
          pipeSources[source],
          pipeCard(PIPES[source], cell(COL.PIPE, destination)),
          {
            pathArc: source < destination ? -0.85 : 0.85
          }
        )
      ),
      { lagRatio: 0.12, runTime: 2.0 }
    ),
    ...say('NOW SHUFFLE ONLY THE PIPE TYPES', C.violet)
  );

  pipeCards = PIPE_ORDER.map(source => pipeSources[source]);

  // ------------------------------------------------------------
  // Different shuffles can produce different losses.
  //
  // The second shuffle is an illustrative additional permutation
  // computed from the supplied fixed model and original data.
  //
  // Shuffle 1: [0, 2, 0, 2] → loss 75% → increase 50 pp.
  // Shuffle 2: [2, 0, 0, 2] → loss 25% → increase 0 pp.
  //
  // Both use the original pipe types, actual outcomes and model.
  // The mean of these two illustrations is 25 percentage points.
  // This is not an exhaustive permutation average.
  // ------------------------------------------------------------

  const SECOND_CALLS = [2, 0, 0, 2];
  const SECOND_RISK = predict(SECOND_CALLS, PIPES);
  const SECOND_DECISIONS = decide(SECOND_RISK);
  const SECOND_LOSS = loss(SECOND_DECISIONS);
  const SECOND_IMPORTANCE = SECOND_LOSS - ORIGINAL_LOSS;

  const REPEAT_MEAN =
    (IMPORTANCE + SECOND_IMPORTANCE) / 2;

  const SHUFFLE_CARD_W = P ? 3.25 : 4.05;
  const SHUFFLE_CARD_H = P ? 3.90 : 3.10;
  const SHUFFLE_CARD_Y = P ? 0.55 : -0.08;
  const SHUFFLE_CARD_SP = P ? 3.55 : 4.45;

  function shuffleExample(number, calls, exampleLoss, x) {
    const y = SHUFFLE_CARD_Y;
    const w = SHUFFLE_CARD_W;
    const h = SHUFFLE_CARD_H;

    const bg = rect(
      w, h, [x, y, 0],
      C.cyan, 0, 1.8, 0.16
    );

    bg.setFill(C.card, 0.95);

    const top = y + h / 2;
    const headY = top - (P ? 0.40 : 0.31);
    const rowStart = top - (P ? 1.09 : 0.87);
    const step = P ? 0.43 : 0.32;

    const title = txt(
      `SHUFFLE ${number}`,
      P ? 21 : 20,
      C.cyan,
      [x, headY, 0],
      true,
      w - 0.25
    );

    const homeHeader = txt(
      'Home',
      SMALL_FONT,
      C.muted,
      [x - w * 0.29, headY - 0.38, 0]
    );

    const callHeader = txt(
      'Calls',
      SMALL_FONT,
      C.muted,
      [x + w * 0.29, headY - 0.38, 0]
    );

    const parts = [bg, title, homeHeader, callHeader];

    for (let i = 0; i < 4; i++) {
      const ry = rowStart - i * step;

      const home = txt(
        HOMES[i],
        CELL_FONT,
        C.ink,
        [x - w * 0.29, ry, 0],
        true
      );

      const value = txt(
        String(calls[i]),
        CELL_FONT,
        C.cyan,
        [x + w * 0.29, ry, 0],
        true
      );

      const divider = line(
        [x - w / 2 + 0.20, ry - step / 2, 0],
        [x + w / 2 - 0.20, ry - step / 2, 0],
        C.muted,
        0.8
      );

      parts.push(home, value, divider);
    }

    const inc = exampleLoss - ORIGINAL_LOSS;

    const lossText = txt(
      `Loss: ${exampleLoss}%`,
      P ? 20 : 20,
      exampleLoss > ORIGINAL_LOSS ? RED : C.green,
      [x, y - h / 2 + (P ? 0.77 : 0.60), 0],
      true,
      w - 0.20
    );

    const incText = txt(
      `Increase: +${inc} pp`,
      P ? 20 : 20,
      C.amber,
      [x, y - h / 2 + (P ? 0.30 : 0.24), 0],
      true,
      w - 0.20
    );

    parts.push(lossText, incText);

    return {
      group: new M.VGroup(...parts),
      increase: incText
    };
  }

  const repeatOne = shuffleExample(
    1,
    SHUFFLED_CALLS,
    SHUFFLED_LOSS,
    -SHUFFLE_CARD_SP / 2
  );

  const repeatTwo = shuffleExample(
    2,
    SECOND_CALLS,
    SECOND_LOSS,
    SHUFFLE_CARD_SP / 2
  );

  // 52 — Different shuffles can produce different results.
  await until(S(52));
  await play(
    ...clearTable(),
    new M.LaggedStart([
      new M.FadeIn(repeatOne.group),
      new M.FadeIn(repeatTwo.group)
    ], { lagRatio: 0.20, runTime: 1.6 }),
    ...fbox([
      ['Back to testing calls', C.cyan],
      'Original pipes and crew findings restored',
      ['Original loss: 25%  |  pp = percentage points', C.amber]
    ]),
    ...say('DIFFERENT SHUFFLES, DIFFERENT RESULTS', C.amber)
  );

  // 53 — Repeat and average the increases.
  await until(S(53));
  await play(
    new M.Indicate(repeatOne.increase, { color: C.amber }),
    new M.Indicate(repeatTwo.increase, { color: C.amber }),
    ...fbox([
      ['Example: mean of two shuffle increases', C.cyan],
      `(${IMPORTANCE} + ${SECOND_IMPORTANCE}) ÷ 2`,
      [`= ${REPEAT_MEAN} percentage points`, C.amber]
    ]),
    ...say('REPEAT THE TEST AND FIND THE MEAN', C.green)
  );

  // ------------------------------------------------------------
  // Final visual summary.
  // ------------------------------------------------------------

  const FINAL_W = P ? 7.00 : 8.40;
  const FINAL_Y = P ? 0.60 : 0.05;
  const FINAL_H = P ? 4.00 : 3.10;

  function finalPicture() {
    const bg = rect(
      FINAL_W,
      FINAL_H,
      [0, FINAL_Y, 0],
      C.violet,
      0,
      2,
      0.18
    );

    bg.setFill(C.card, 0.95);

    const title = txt(
      'PERMUTATION IMPORTANCE',
      P ? 26 : 26,
      C.violet,
      [0, FINAL_Y + FINAL_H / 2 - 0.43, 0],
      false,
      FINAL_W - 0.50
    );

    const dy = P ? 0.65 : 0.45;
    const firstY = FINAL_Y + FINAL_H / 2 - 1.0;

    const step1 = txt(
      '1. Shuffle one feature',
      P ? 22 : 22,
      C.cyan,
      [0, firstY, 0],
      false,
      FINAL_W - 0.45
    );

    const step2 = txt(
      '2. Keep everything else fixed',
      P ? 22 : 22,
      C.green,
      [0, firstY - dy, 0],
      false,
      FINAL_W - 0.45
    );

    const step3 = txt(
      '3. Measure the increase in loss',
      P ? 22 : 22,
      C.amber,
      [0, firstY - 2 * dy, 0],
      false,
      FINAL_W - 0.45
    );

    const sepY = FINAL_Y - FINAL_H / 2 + 0.80;

    const separator = line(
      [-FINAL_W / 2 + 0.45, sepY, 0],
      [FINAL_W / 2 - 0.45, sepY, 0],
      C.muted,
      1
    );

    const takeaway = txt(
      P ? 'Bigger increase = more dependence' : 'Bigger loss increase = more model dependence',
      P ? 21 : 22,
      C.amber,
      [0, FINAL_Y - FINAL_H / 2 + 0.40, 0],
      false,
      FINAL_W - 0.45
    );

    return new M.VGroup(
      bg, title, step1, step2, step3, separator, takeaway
    );
  }

  // 54 — Greater loss increase means greater model dependence.
  await until(S(54));

  const finalCard = finalPicture();

  await play(
    new M.FadeOut(repeatOne.group),
    new M.FadeOut(repeatTwo.group),
    new M.FadeIn(finalCard),
    ...fbox([
      ['Permutation importance', C.violet],
      'Loss after shuffling − original loss',
      ['Repeat with different shuffles', C.green]
    ], C.violet),
    ...say('MORE LOSS INCREASE → MORE DEPENDENCE', C.amber)
  );
}
