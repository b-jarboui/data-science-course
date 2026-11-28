// lesson 16.1.6
// Subgroup evaluation: does the model work equally well across groups?
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

  const RISK = HOMES.map((_, i) =>
    MODEL[PIPES[i]][CALLS[i]]
  );

  const CUTOFF = 50;

  const TODAY = RISK.map(r => r >= CUTOFF);

  const MISSED = ACTUAL.map(
    (urgent, i) => urgent && !TODAY[i]
  );

  const GROUPS = ['North', 'South'];

  const URGENT_GROUPS = GROUPS.map(district =>
    HOMES.map((_, i) => i).filter(
      i => DISTRICTS[i] === district && ACTUAL[i]
    )
  );

  const BASE_COUNTS = URGENT_GROUPS.map(
    indices => indices.length
  );

  const BASE_MISSES = URGENT_GROUPS.map(
    indices => indices.filter(i => MISSED[i]).length
  );

  const rate = (missed, urgent) =>
    urgent === 0 ? null : 100 * missed / urgent;

  const BASE_RATES = BASE_COUNTS.map((n, i) =>
    rate(BASE_MISSES[i], n)
  );

  // Hypothetical scenario 1:
  // One additional confirmed urgent request in each district.
  // Both new urgent requests are caught.

  const CAUGHT_COUNTS = BASE_COUNTS.map(n => n + 1);

  const CAUGHT_MISSES = BASE_MISSES.slice();

  const CAUGHT_RATES = CAUGHT_COUNTS.map((n, i) =>
    rate(CAUGHT_MISSES[i], n)
  );

  // Hypothetical scenario 2:
  // Return to the original four requests.
  // Add one additional confirmed urgent request per district.
  // Both new urgent requests are missed.

  const MISSED_COUNTS = BASE_COUNTS.map(n => n + 1);

  const MISSED_MISSES = BASE_MISSES.map(n => n + 1);

  const MISSED_RATES = MISSED_COUNTS.map((n, i) =>
    rate(MISSED_MISSES[i], n)
  );

  const OVERALL_COUNT = BASE_COUNTS.reduce(
    (a, b) => a + b, 0
  );

  const OVERALL_MISSES = BASE_MISSES.reduce(
    (a, b) => a + b, 0
  );

  const OVERALL_RATE = rate(
    OVERALL_MISSES,
    OVERALL_COUNT
  );

  // Checked facts:
  //
  // A: North, 90%, TODAY, confirmed urgent, caught.
  // B: North, 10%, WAIT, not urgent.
  // C: South, 50%, TODAY, confirmed urgent, caught.
  // D: South, 30%, WAIT, confirmed urgent, missed.
  //
  // Original:
  //   North: 0 missed / 1 urgent = 0%.
  //   South: 1 missed / 2 urgent = 50%.
  //
  // If both new urgent requests are caught:
  //   North: 0 / 2 = 0%.
  //   South: 1 / 3 ≈ 33%.
  //
  // If both new urgent requests are missed:
  //   North: 1 / 2 = 50%.
  //   South: 2 / 3 ≈ 67%.
  //
  // Overall original missed-visit rate:
  //   1 / 3 ≈ 33%.
  //
  // The two hypothetical scenarios are separate alternatives.
  // They are NOT cumulative updates.
  //
  // These examples illustrate sensitivity to small counts.
  // They are not uncertainty intervals.
  //
  // No claim of unfair treatment is established by these
  // four historical requests alone.

  const RED = C.red || '#FF647C';

  const NORTH = C.cyan;
  const SOUTH = C.amber;

  const DISTRICT_COLORS = [NORTH, SOUTH];

  const districtColor = i =>
    DISTRICTS[i] === 'North' ? NORTH : SOUTH;

  const percent = v =>
    v === null
      ? 'Undefined'
      : Number.isInteger(v)
        ? `${v}%`
        : `≈${Math.round(v)}%`;

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Phone: 8 x 14.22
  // Content between y = -5.5 and y = 4.3.
  //
  // Laptop: 14.22 x 8
  // Content between y = -3.0 and y = 2.3.
  //
  // Phone: district baskets above missed-rate bars.
  // Laptop: district baskets left, missed-rate bars right.
  // ------------------------------------------------------------

  const PILL = P
    ? [0, 3.85, 0]
    : [0, 1.95, 0];

  const BOXP = P
    ? [0, -4.48, 0]
    : [0, -2.43, 0];

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

  function circle(radius, p, color, fill = 0, stroke = 2) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: stroke
    });

    c.setFill(color, fill);
    c.moveTo(p);

    return c;
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
    const lh = P ? 0.39 : 0.29;
    const padding = P ? 0.32 : 0.20;

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

    const maxw = P ? FW - 0.70 : FW - 1.60;
    const maxh = P ? 1.65 : 0.98;

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
  // Opening picture: homes in two districts.
  // ------------------------------------------------------------

  function house(x, y, name, color) {
    const wall = new M.Rectangle({
      width: 0.83,
      height: 0.72,
      color,
      strokeWidth: 2
    });

    wall.setFill(C.card, 0.94);
    wall.moveTo([x, y, 0]);

    const roofL = line(
      [x - 0.52, y + 0.34, 0],
      [x, y + 0.82, 0],
      color,
      3
    );

    const roofR = line(
      [x, y + 0.82, 0],
      [x + 0.52, y + 0.34, 0],
      color,
      3
    );

    const door = solidRect(
      0.21,
      0.35,
      [x, y - 0.18, 0],
      color,
      0.28
    );

    const windows = [-0.24, 0.24].map(dx =>
      solidRect(
        0.15,
        0.15,
        [x + dx, y + 0.12, 0],
        color,
        0.62
      )
    );

    const pipe = line(
      [x - 0.42, y - 0.44, 0],
      [x + 0.42, y - 0.44, 0],
      C.violet,
      3.5
    );

    const label = txt(
      `Home ${name}`,
      P ? 17 : 19,
      C.ink,
      [x, y - 0.73, 0]
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

  const MAP_X = P ? 1.85 : 3.00;
  const MAP_Y = P ? 1.18 : 0.03;
  const MAP_W = P ? 3.35 : 5.05;
  const MAP_H = P ? 3.20 : 2.65;

  function districtPicture(group, homes) {
    const x = group === 0 ? -MAP_X : MAP_X;
    const color = DISTRICT_COLORS[group];

    const bg = rect(
      MAP_W,
      MAP_H,
      [x, MAP_Y, 0],
      color,
      0,
      2.1,
      0.18
    );

    bg.setFill(C.card, 0.80);

    const houseSpacing = P ? 1.30 : 1.65;

    const pictures = homes.map((name, i) =>
      house(
        x + (i - 0.5) * houseSpacing,
        MAP_Y - 0.13,
        name,
        color
      )
    );

    const title = txt(
      GROUPS[group].toUpperCase(),
      P ? 24 : 25,
      color,
      [x, MAP_Y + MAP_H / 2 - 0.35, 0],
      true,
      MAP_W - 0.30
    );

    return {
      group: new M.VGroup(bg, ...pictures),
      title
    };
  }

  const northPicture = districtPicture(0, ['A', 'B']);
  const southPicture = districtPicture(1, ['C', 'D']);

  const serviceNote = txt(
    'Good service in both districts',
    P ? 23 : 24,
    C.green,
    [0, P ? -1.05 : -1.70, 0],
    false,
    FW - 0.90
  );

  // 0 — Manage visits across two parts of a town.
  await until(S(0));
  await play(
    new M.FadeIn(northPicture.group),
    new M.FadeIn(southPicture.group),
    ...say('ONE WATER COMPANY, TWO PARTS OF TOWN')
  );

  // 1 — The two districts are North and South.
  await until(S(1));
  await play(
    new M.FadeIn(northPicture.title),
    new M.FadeIn(southPicture.title),
    ...say('DISTRICTS: NORTH AND SOUTH')
  );

  // 2 — Both districts should receive good service.
  await until(S(2));
  await play(
    new M.FadeIn(serviceNote),
    ...fbox([
      ['North: good service', NORTH],
      ['South: good service', SOUTH]
    ], C.green),
    ...say('GOOD SERVICE FOR BOTH DISTRICTS', C.green)
  );

  // 3 — Does the model miss more urgent requests in one district?
  await until(S(3));
  await play(
    ...fbox([
      ['North missed-visit rate: ?', NORTH],
      ['South missed-visit rate: ?', SOUTH]
    ]),
    ...say('DOES THE MODEL MISS MORE IN ONE DISTRICT?', C.violet)
  );

  // ------------------------------------------------------------
  // Four-home audit table.
  //
  // Keep A, B, C and D in their fixed row order.
  // North and South always have visible text labels.
  //
  // Risk, model decision and confirmed urgency are separate.
  // The missed-urgent mark is added only after all comparisons
  // have been introduced.
  // ------------------------------------------------------------

  const TABLE_WIDTHS = P
    ? [1.20, 2.15, 1.45, 1.40, 0.75]
    : [1.75, 3.15, 2.05, 2.05, 1.35];

  const TABLE_W = TABLE_WIDTHS.reduce(
    (a, b) => a + b, 0
  );

  const LEFT = -TABLE_W / 2;

  const HEADER_Y = P ? 2.88 : 1.30;

  const ROW_TOP = P ? 2.02 : 0.63;
  const ROW_STEP = P ? 1.00 : 0.66;
  const ROW_H = P ? 0.83 : 0.57;

  const COL = {
    HOME: 0,
    RISK: 1,
    DECISION: 2,
    ACTUAL: 3,
    MISSED: 4
  };

  const colLeft = j =>
    LEFT + TABLE_WIDTHS.slice(0, j).reduce(
      (a, b) => a + b, 0
    );

  const colx = j =>
    colLeft(j) + TABLE_WIDTHS[j] / 2;

  const rowy = i =>
    ROW_TOP - i * ROW_STEP;

  const cell = (j, i) =>
    [colx(j), rowy(i), 0];

  const RISK_W = TABLE_WIDTHS[COL.RISK] - 0.40;
  const RISK_H = P ? 0.15 : 0.12;

  function header(s, j, color = C.muted, dy = 0) {
    return txt(
      s,
      P ? 15 : 17,
      color,
      [colx(j), HEADER_Y + dy, 0],
      false,
      TABLE_WIDTHS[j] - 0.10
    );
  }

  function rowBackground(i) {
    const bg = rect(
      TABLE_W,
      ROW_H,
      [0, rowy(i), 0],
      C.muted,
      0,
      0.9,
      0.09
    );

    bg.setFill(
      C.card,
      i % 2 === 0 ? 0.85 : 0.60
    );

    return bg;
  }

  function homeCell(i) {
    const y = rowy(i);
    const color = districtColor(i);

    const edge = line(
      [LEFT + 0.035, y - ROW_H * 0.31, 0],
      [LEFT + 0.035, y + ROW_H * 0.31, 0],
      color,
      4
    );

    const home = txt(
      `Home ${HOMES[i]}`,
      P ? 19 : 20,
      C.ink,
      [colx(COL.HOME), y + 0.12, 0],
      false,
      TABLE_WIDTHS[COL.HOME] - 0.15
    );

    const district = txt(
      DISTRICTS[i],
      P ? 15 : 15,
      color,
      [colx(COL.HOME), y - 0.17, 0],
      false,
      TABLE_WIDTHS[COL.HOME] - 0.15
    );

    return new M.VGroup(edge, home, district);
  }

  function riskHeader() {
    const x = colx(COL.RISK);

    return new M.VGroup(
      header(
        'Predicted risk',
        COL.RISK,
        C.cyan,
        0.12
      ),
      txt(
        '0%',
        P ? 12 : 13,
        C.muted,
        [x - RISK_W / 2, HEADER_Y - 0.16, 0],
        true
      ),
      txt(
        '100%',
        P ? 12 : 13,
        C.muted,
        [x + RISK_W / 2, HEADER_Y - 0.16, 0],
        true
      )
    );
  }

  function riskCell(value, i) {
    const x = colx(COL.RISK);
    const y = rowy(i);
    const by = y - 0.15;

    const track = solidRect(
      RISK_W,
      RISK_H,
      [x, by, 0],
      C.muted,
      0.16
    );

    const w = RISK_W * value / 100;

    const fill = solidRect(
      w,
      RISK_H,
      [x - RISK_W / 2 + w / 2, by, 0],
      C.cyan,
      0.90
    );

    const label = txt(
      `${value}%`,
      P ? 21 : 22,
      C.cyan,
      [x, y + 0.105, 0],
      true
    );

    return new M.VGroup(track, fill, label);
  }

  function thresholdMark(i) {
    const x =
      colx(COL.RISK) -
      RISK_W / 2 +
      RISK_W * CUTOFF / 100;

    const y = rowy(i) - 0.15;

    return line(
      [x, y - RISK_H / 2 - 0.055, 0],
      [x, y + RISK_H / 2 + 0.055, 0],
      C.amber,
      2.7
    );
  }

  function decisionCell(today, i) {
    const p = cell(COL.DECISION, i);
    const color = today ? C.amber : C.muted;

    const w = TABLE_WIDTHS[COL.DECISION] - 0.15;
    const h = P ? 0.51 : 0.42;

    const bg = rect(
      w, h, p,
      color,
      today ? 0.13 : 0.04,
      1.5,
      0.10
    );

    const label = txt(
      today ? 'TODAY' : 'WAIT',
      P ? 17 : 18,
      color,
      p,
      true,
      w - 0.12
    );

    return new M.VGroup(bg, label);
  }

  function actualCell(i) {
    const x = colx(COL.ACTUAL);
    const y = rowy(i);

    const color = ACTUAL[i] ? C.green : C.muted;

    const mark = circle(
      P ? 0.075 : 0.070,
      [
        x,
        y + (P ? 0.15 : 0.12),
        0
      ],
      color,
      ACTUAL[i] ? 1 : 0,
      1.8
    );

    const label = txt(
      ACTUAL[i] ? 'URGENT' : 'NOT URGENT',
      P ? 16 : 17,
      color,
      [x, y - 0.13, 0],
      false,
      TABLE_WIDTHS[COL.ACTUAL] - 0.10
    );

    return new M.VGroup(mark, label);
  }

  function missedCell(i) {
    const p = cell(COL.MISSED, i);

    const isMissed = MISSED[i];

    const color = isMissed
      ? RED
      : C.green;

    const mark = txt(
      isMissed ? '×' : '✓',
      P ? 25 : 27,
      color,
      [
        p[0],
        p[1] + 0.095,
        0
      ]
    );

    const label = txt(
      isMissed ? 'Missed' : 'Caught',
      P ? 12 : 14,
      color,
      [
        p[0],
        p[1] - 0.17,
        0
      ],
      false,
      TABLE_WIDTHS[COL.MISSED] - 0.06
    );

    return new M.VGroup(mark, label);
  }

  function rowOutline(i, color) {
    return rect(
      TABLE_W + 0.04,
      ROW_H + 0.04,
      [0, rowy(i), 0],
      color,
      0,
      2.5,
      0.10
    );
  }

  const rowBackgrounds = HOMES.map((_, i) =>
    rowBackground(i)
  );

  const homeCells = HOMES.map((_, i) =>
    homeCell(i)
  );

  const homeHead = header('Home', COL.HOME);

  const riskHead = riskHeader();

  const decisionHead = new M.VGroup(
    header(
      'Model',
      COL.DECISION,
      C.amber,
      0.12
    ),
    header(
      'Decision',
      COL.DECISION,
      C.muted,
      -0.12
    )
  );

  const actualHead = new M.VGroup(
    header(
      'Crew',
      COL.ACTUAL,
      C.green,
      0.12
    ),
    header(
      'Finding',
      COL.ACTUAL,
      C.muted,
      -0.12
    )
  );

  const missedHead = header(
    'Urgent',
    COL.MISSED
  );

  const risks = RISK.map((v, i) =>
    riskCell(v, i)
  );

  const thresholds = HOMES.map((_, i) =>
    thresholdMark(i)
  );

  const decisions = TODAY.map((v, i) =>
    decisionCell(v, i)
  );

  const actuals = HOMES.map((_, i) =>
    actualCell(i)
  );

  // No caught/missed result is assigned to B.
  // B is not a confirmed urgent request.

  const auditMarks = HOMES.map((_, i) =>
    ACTUAL[i] ? missedCell(i) : null
  );

  const notUrgentDash = txt(
    '—',
    21,
    C.muted,
    cell(COL.MISSED, 1),
    true
  );

  const missedDOutline = rowOutline(3, RED);

  // 4 — Four requests from the past.
  await until(S(4));
  await play(
    ...outs([
      northPicture.group,
      northPicture.title,
      southPicture.group,
      southPicture.title,
      serviceNote
    ]),
    ...dropBox(),
    ...ins(rowBackgrounds),
    new M.FadeIn(homeHead),
    ...say('OUR FOUR HISTORICAL REQUESTS')
  );

  // 5 — Homes A and B belong to North.
  await until(S(5));
  await play(
    new M.FadeIn(homeCells[0]),
    new M.FadeIn(homeCells[1]),
    ...say('NORTH: HOMES A AND B', NORTH)
  );

  // 6 — Homes C and D belong to South.
  await until(S(6));
  await play(
    new M.FadeIn(homeCells[2]),
    new M.FadeIn(homeCells[3]),
    ...say('SOUTH: HOMES C AND D', SOUTH)
  );

  // 7 — Home A has 90% predicted risk.
  await until(S(7));
  await play(
    new M.FadeIn(riskHead),
    new M.FadeIn(risks[0]),
    ...say('HOME A: 90% PREDICTED RISK')
  );

  // 8 — Home B has 10%.
  await until(S(8));
  await play(
    new M.FadeIn(risks[1]),
    ...say('HOME B: 10% PREDICTED RISK')
  );

  // 9 — Home C has 50%.
  await until(S(9));
  await play(
    new M.FadeIn(risks[2]),
    ...say('HOME C: 50% PREDICTED RISK')
  );

  // 10 — Home D has 30%.
  await until(S(10));
  await play(
    new M.FadeIn(risks[3]),
    ...say('HOME D: 30% PREDICTED RISK')
  );

  // 11 — Risk of 50% or more goes on today's list.
  await until(S(11));
  await play(
    new M.FadeIn(decisionHead),
    new M.LaggedStart(
      thresholds.map(t => new M.Create(t)),
      { lagRatio: 0.10, runTime: 1.10 }
    ),
    ...fbox([
      ['Risk ≥ 50%  →  TODAY', C.amber],
      ['Risk < 50%  →  WAIT', C.muted]
    ], C.amber),
    ...say('DECISION CUTOFF: 50%', C.amber)
  );

  // 12 — A and C go on today's list.
  await until(S(12));
  await play(
    new M.FadeIn(decisions[0]),
    new M.FadeIn(decisions[2]),
    ...say('TODAY: HOMES A AND C', C.amber)
  );

  // 13 — B and D stay off today's list.
  await until(S(13));
  await play(
    new M.FadeIn(decisions[1]),
    new M.FadeIn(decisions[3]),
    ...say('WAIT: HOMES B AND D', C.muted)
  );

  // 14 — Add the later findings from the crews.
  await until(S(14));
  await play(
    new M.FadeIn(actualHead),
    ...fbox([
      ['Model decision', C.amber],
      ['What the crew really found', C.green]
    ]),
    ...say('COMPARE WITH THE CREW’S FINDINGS', C.green)
  );

  // 15 — A, C and D really needed urgent visits.
  await until(S(15));
  await play(
    new M.FadeIn(actuals[0]),
    new M.FadeIn(actuals[2]),
    new M.FadeIn(actuals[3]),
    ...say('REALLY URGENT: A, C AND D', C.green)
  );

  // 16 — Home B was not urgent.
  await until(S(16));
  await play(
    new M.FadeIn(actuals[1]),
    ...say('HOME B WAS NOT URGENT', C.muted)
  );

  // 17 — Define a missed urgent visit.
  await until(S(17));
  await play(
    new M.FadeIn(missedHead),
    ...ins(auditMarks),
    new M.FadeIn(notUrgentDash),
    new M.Create(missedDOutline),
    ...fbox([
      ['Confirmed urgent + model says WAIT', RED],
      ['= missed urgent visit', RED]
    ], RED),
    ...say('MISSED URGENT VISIT: HOME D', RED)
  );

  // ------------------------------------------------------------
  // District baskets.
  //
  // Only copies of confirmed urgent requests enter the baskets.
  // Home B is excluded because its visit was not urgent.
  //
  // North contains A.
  // South contains C and D.
  //
  // The denominator is the number of confirmed urgent requests,
  // not the number of all requests in the district.
  // ------------------------------------------------------------

  const BASKET_X = P
    ? [-1.80, 1.80]
    : [-4.80, -1.80];

  const BASKET_Y = P ? 1.18 : -0.20;
  const BASKET_W = P ? 3.32 : 2.85;
  const BASKET_H = P ? 3.68 : 3.03;

  const BASKET_TOP =
    BASKET_Y + BASKET_H / 2;

  const BASKET_BOTTOM =
    BASKET_Y - BASKET_H / 2;

  const BASKET_ROW_TOP = P ? 1.92 : 0.25;
  const BASKET_ROW_STEP = P ? 0.83 : 0.56;

  const CARD_W = BASKET_W - 0.34;
  const CARD_H = P ? 0.67 : 0.51;

  const basketSlot = (group, slot) => [
    BASKET_X[group],
    BASKET_ROW_TOP - slot * BASKET_ROW_STEP,
    0
  ];

  function basket(group) {
    const color = DISTRICT_COLORS[group];
    const x = BASKET_X[group];

    const bg = rect(
      BASKET_W,
      BASKET_H,
      [x, BASKET_Y, 0],
      color,
      0,
      2.1,
      0.17
    );

    bg.setFill(C.card, 0.90);

    const title = txt(
      GROUPS[group].toUpperCase(),
      P ? 23 : 22,
      color,
      [x, BASKET_TOP - 0.30, 0],
      true,
      BASKET_W - 0.20
    );

    const subtitle = txt(
      'Confirmed urgent only',
      15,
      C.muted,
      [x, BASKET_TOP - 0.61, 0],
      false,
      BASKET_W - 0.25
    );

    const base = line(
      [
        x - BASKET_W * 0.40,
        BASKET_BOTTOM + (P ? 0.53 : 0.48),
        0
      ],
      [
        x + BASKET_W * 0.40,
        BASKET_BOTTOM + (P ? 0.53 : 0.48),
        0
      ],
      color,
      1.3
    );

    return new M.VGroup(
      bg,
      title,
      subtitle,
      base
    );
  }

  const baskets = [
    basket(0),
    basket(1)
  ];

  function urgentRequestCard(
    name,
    group,
    slot,
    today,
    hypothetical = false
  ) {
    const p = basketSlot(group, slot);
    const x = p[0];
    const y = p[1];

    const color = DISTRICT_COLORS[group];

    const bg = rect(
      CARD_W,
      CARD_H,
      p,
      color,
      0,
      1.4,
      0.09
    );

    bg.setFill(C.card, 0.98);

    const home = txt(
      hypothetical ? 'New request' : `Home ${name}`,
      17,
      C.ink,
      [x - CARD_W * 0.21, y + 0.10, 0],
      false,
      CARD_W * 0.48
    );

    const actual = txt(
      'Urgent',
      15,
      C.green,
      [x - CARD_W * 0.21, y - 0.13, 0],
      false,
      CARD_W * 0.47
    );

    const decisionColor = today === null
      ? C.muted
      : today
        ? C.amber
        : C.muted;

    const decision = txt(
      today === null
        ? '?'
        : today
          ? 'TODAY'
          : 'WAIT',
      P ? 17 : 16,
      decisionColor,
      [x + CARD_W * 0.25, y, 0],
      true,
      CARD_W * 0.35
    );

    const divider = line(
      [x + 0.07, y - CARD_H * 0.31, 0],
      [x + 0.07, y + CARD_H * 0.31, 0],
      C.muted,
      0.9
    );

    return new M.VGroup(
      bg,
      home,
      actual,
      divider,
      decision
    );
  }

  function missedRing(group, slot) {
    const p = basketSlot(group, slot);

    const ring = rect(
      CARD_W + 0.055,
      CARD_H + 0.06,
      p,
      RED,
      0,
      2.7,
      0.14
    );

    const cross = txt(
      '×',
      P ? 19 : 18,
      RED,
      [
        p[0] + CARD_W / 2 - 0.09,
        p[1] + CARD_H / 2 - 0.03,
        0
      ]
    );

    return new M.VGroup(ring, cross);
  }

  const cardsA = urgentRequestCard(
    'A',
    0,
    0,
    TODAY[0]
  );

  const cardsC = urgentRequestCard(
    'C',
    1,
    0,
    TODAY[2]
  );

  const cardsD = urgentRequestCard(
    'D',
    1,
    1,
    TODAY[3]
  );

  const ringD = missedRing(1, 1);

  function countLabel(group, n, missed = null) {
    const color = DISTRICT_COLORS[group];

    const s = missed === null
      ? `${n} urgent ${n === 1 ? 'request' : 'requests'}`
      : `${missed} missed / ${n} urgent`;

    return txt(
      s,
      P ? 17 : 15,
      color,
      [
        BASKET_X[group],
        BASKET_BOTTOM + 0.27,
        0
      ],
      true,
      BASKET_W - 0.22
    );
  }

  let basketCounts = [
    countLabel(0, BASE_COUNTS[0]),
    countLabel(1, BASE_COUNTS[1])
  ];

  function changeCount(group, n, missed = null) {
    const next = countLabel(group, n, missed);

    const a = [
      new M.FadeOut(basketCounts[group]),
      new M.FadeIn(next)
    ];

    basketCounts[group] = next;

    return a;
  }

  const basketStatusPos = P
    ? [0, -0.94, 0]
    : [-3.30, 1.55, 0];

  function basketStatus(s, color = C.muted) {
    return txt(
      s,
      P ? 17 : 16,
      color,
      basketStatusPos,
      true,
      P ? 6.75 : 5.80
    );
  }

  let statusNow = basketStatus(
    'ORIGINAL HISTORICAL REQUESTS'
  );

  function changeStatus(s, color = C.muted) {
    const next = basketStatus(s, color);

    const a = [
      new M.FadeOut(statusNow),
      new M.FadeIn(next)
    ];

    statusNow = next;

    return a;
  }

  // 18 — Imagine two district baskets.
  await until(S(18));
  await play(
    ...outs([
      ...rowBackgrounds,
      ...homeCells,
      homeHead,
      riskHead,
      decisionHead,
      actualHead,
      missedHead,
      ...risks,
      ...thresholds,
      ...decisions,
      ...actuals,
      ...auditMarks,
      notUrgentDash,
      missedDOutline
    ]),
    ...dropBox(),
    new M.FadeIn(baskets[0]),
    new M.FadeIn(baskets[1]),
    new M.FadeIn(statusNow),
    ...say('ONE BASKET FOR EACH DISTRICT')
  );

  // 19 — Copy confirmed urgent requests into their district baskets.
  await until(S(19));
  await play(
    lagIn(
      [cardsA, cardsC, cardsD],
      1.25,
      0.17
    ),
    ...ins(basketCounts),
    ...fbox([
      ['Include confirmed urgent requests only', C.green],
      'Home B is not included: it was not urgent'
    ], C.green),
    ...say('KEEP ONLY THE CONFIRMED URGENT REQUESTS', C.green)
  );

  // 20 — The North basket contains Home A.
  await until(S(20));
  await play(
    new M.Indicate(
      cardsA,
      { color: NORTH }
    ),
    ...fbox([
      ['North: Home A', NORTH],
      '1 confirmed urgent request'
    ], NORTH),
    ...say('NORTH HAS ONE URGENT REQUEST', NORTH)
  );

  // 21 — The South basket contains C and D.
  await until(S(21));
  await play(
    new M.Indicate(
      cardsC,
      { color: SOUTH }
    ),
    new M.Indicate(
      cardsD,
      { color: SOUTH }
    ),
    ...fbox([
      ['South: Homes C and D', SOUTH],
      '2 confirmed urgent requests'
    ], SOUTH),
    ...say('SOUTH HAS TWO URGENT REQUESTS', SOUTH)
  );

  // 22 — Mark every missed urgent request with a red ring.
  await until(S(22));
  await play(
    new M.Create(ringD),
    ...fbox([
      ['Red ring = confirmed urgent but missed', RED],
      ['Home D is the only original missed visit', RED]
    ], RED),
    ...say('RED RING = MISSED URGENT VISIT', RED)
  );

  // 23 — Name subgroup evaluation.
  await until(S(23));
  await play(
    ...fbox([
      ['Subgroup evaluation', C.violet],
      'Compare model performance across smaller groups'
    ], C.violet),
    ...say('SUBGROUP EVALUATION', C.violet)
  );

  // ------------------------------------------------------------
  // Missed-visit rate bars.
  //
  // Both districts use the same 0–100% scale.
  // A rate of 0% is represented by an empty track and zero marker.
  // No minimum-width bar exaggerates zero.
  //
  // District color identifies the group.
  // Red identifies missed urgent visits inside the rate bar.
  // ------------------------------------------------------------

  const RATE_X = P ? 0 : 3.40;
  const RATE_W = P ? 5.18 : 4.35;
  const RATE_H = P ? 0.30 : 0.27;

  const RATE_Y = P
    ? [-2.05, -3.15]
    : [0.63, -0.84];

  const RATE_LEFT = RATE_X - RATE_W / 2 - 0.18;

  const rateX = v =>
    RATE_LEFT + RATE_W * v / 100;

  function districtRateBar(group, missed, urgent) {
    const y = RATE_Y[group];
    const color = DISTRICT_COLORS[group];

    const value = rate(missed, urgent);

    const title = T(
      `${GROUPS[group]} — ${missed}/${urgent}`,
      P ? 20 : 19,
      color
    );

    if (title.getWidth() > RATE_W - 0.20) {
      title.scale(
        (RATE_W - 0.20) / title.getWidth()
      );
    }

    title.moveTo([
      RATE_LEFT + title.getWidth() / 2,
      y + (P ? 0.35 : 0.34),
      0
    ]);

    const track = solidRect(
      RATE_W,
      RATE_H,
      [RATE_LEFT + RATE_W / 2, y, 0],
      C.muted,
      0.13
    );

    const outline = rect(
      RATE_W,
      RATE_H,
      [RATE_LEFT + RATE_W / 2, y, 0],
      color,
      0,
      1.5,
      0.05
    );

    const parts = [
      track,
      outline,
      title
    ];

    if (value > 0) {
      const w = RATE_W * value / 100;

      const fill = solidRect(
        w,
        RATE_H,
        [RATE_LEFT + w / 2, y, 0],
        RED,
        0.82
      );

      const end = line(
        [
          rateX(value),
          y - RATE_H / 2 - 0.045,
          0
        ],
        [
          rateX(value),
          y + RATE_H / 2 + 0.045,
          0
        ],
        RED,
        2.5
      );

      parts.push(fill, end);
    } else {
      parts.push(
        line(
          [
            rateX(0),
            y - RATE_H / 2 - 0.065,
            0
          ],
          [
            rateX(0),
            y + RATE_H / 2 + 0.065,
            0
          ],
          C.green,
          3
        )
      );
    }

    const valueText = txt(
      percent(value),
      P ? 23 : 23,
      value === 0 ? C.green : RED,
      [
        RATE_LEFT + RATE_W + 0.62,
        y,
        0
      ],
      true,
      P ? 1.14 : 1.05
    );

    const zero = txt(
      '0%',
      13,
      C.muted,
      [
        RATE_LEFT,
        y - RATE_H / 2 - 0.18,
        0
      ],
      true
    );

    const hundred = txt(
      '100%',
      13,
      C.muted,
      [
        RATE_LEFT + RATE_W,
        y - RATE_H / 2 - 0.18,
        0
      ],
      true
    );

    parts.push(
      valueText,
      zero,
      hundred
    );

    return new M.VGroup(...parts);
  }

  let rateBars = [null, null];

  const rateTitle = txt(
    'MISSED-VISIT RATE',
    P ? 18 : 20,
    C.ink,
    [
      RATE_X,
      P ? -1.42 : 1.42,
      0
    ],
    true,
    P ? 6.40 : 5.10
  );

  function addRate(group, missed, urgent) {
    rateBars[group] = districtRateBar(
      group,
      missed,
      urgent
    );

    return new M.FadeIn(rateBars[group]);
  }

  function updateRate(group, missed, urgent) {
    const next = districtRateBar(
      group,
      missed,
      urgent
    );

    const old = rateBars[group];

    rateBars[group] = next;

    return [
      new M.FadeOut(old),
      new M.FadeIn(next)
    ];
  }

  function basketOutline(group, color) {
    return rect(
      BASKET_W + 0.09,
      BASKET_H + 0.09,
      [BASKET_X[group], BASKET_Y, 0],
      color,
      0,
      2.6,
      0.18
    );
  }

  const northOutline = basketOutline(
    0,
    NORTH
  );

  const southOutline = basketOutline(
    1,
    SOUTH
  );

  // 24 — Start with North.
  await until(S(24));
  await play(
    new M.Create(northOutline),
    ...say('START WITH THE NORTH DISTRICT', NORTH)
  );

  // 25 — A is caught, so North has zero missed urgent visits.
  await until(S(25));
  await play(
    new M.Indicate(
      cardsA,
      { color: C.green }
    ),
    ...changeCount(
      0,
      BASE_COUNTS[0],
      BASE_MISSES[0]
    ),
    ...fbox([
      ['Home A: confirmed urgent', C.green],
      ['Model decision: TODAY', C.amber],
      ['Missed urgent visits: 0', NORTH]
    ], NORTH),
    ...say('NORTH: ZERO MISSED URGENT VISITS', NORTH)
  );

  // 26 — Zero out of one gives 0%.
  await until(S(26));
  await play(
    new M.FadeIn(rateTitle),
    addRate(
      0,
      BASE_MISSES[0],
      BASE_COUNTS[0]
    ),
    ...fbox([
      ['0 missed ÷ 1 urgent = 0', NORTH],
      ['0 × 100 = 0%', C.green]
    ], NORTH),
    ...say('NORTH: 0 OUT OF 1 = 0%', NORTH)
  );

  // 27 — Look at South.
  await until(S(27));
  await play(
    new M.FadeOut(northOutline),
    new M.Create(southOutline),
    ...say('NOW THE SOUTH DISTRICT', SOUTH)
  );

  // 28 — C is caught, D is missed.
  await until(S(28));
  await play(
    new M.Indicate(
      cardsC,
      { color: C.green }
    ),
    new M.Indicate(
      ringD,
      { color: RED }
    ),
    ...changeCount(
      1,
      BASE_COUNTS[1],
      BASE_MISSES[1]
    ),
    ...fbox([
      ['Home C: caught', C.green],
      ['Home D: missed', RED]
    ], SOUTH),
    ...say('SOUTH: ONE CAUGHT, ONE MISSED', SOUTH)
  );

  // 29 — One missed out of two gives 50%.
  await until(S(29));
  await play(
    addRate(
      1,
      BASE_MISSES[1],
      BASE_COUNTS[1]
    ),
    ...fbox([
      ['1 missed ÷ 2 urgent = 0.5', SOUTH],
      ['0.5 × 100 = 50%', RED]
    ], SOUTH),
    ...say('SOUTH: 1 OUT OF 2 = 50%', SOUTH)
  );

  // 30 — Name the missed-visit rate.
  await until(S(30));
  await play(
    new M.FadeOut(southOutline),
    new M.Indicate(
      rateTitle,
      { color: C.cyan }
    ),
    ...fbox([
      ['Missed-visit rate', C.cyan],
      'Share of confirmed urgent requests missed'
    ]),
    ...say('THIS SHARE IS THE MISSED-VISIT RATE')
  );

  // ------------------------------------------------------------
  // Formula — after counting the requests visually.
  // ------------------------------------------------------------

  // 31 — Introduce the formula.
  await until(S(31));
  await play(
    ...fbox([
      ['Count the missed urgent visits', RED],
      ['Divide by all confirmed urgent visits', C.green]
    ]),
    ...say('ONE SHORT FORMULA')
  );

  // 32 — Missed urgent visits / confirmed urgent visits.
  await until(S(32));
  await play(
    ...fbox([
      ['missed-visit rate =', C.cyan],
      ['missed urgent visits', RED],
      ['÷ confirmed urgent visits', C.green]
    ]),
    ...say('MISSED URGENT ÷ ALL CONFIRMED URGENT')
  );

  // 33 — Multiply by 100 for a percentage.
  await until(S(33));
  await play(
    ...fbox([
      ['missed-visit rate (%) =', C.cyan],
      '(missed urgent ÷ confirmed urgent)',
      ['× 100', C.amber]
    ]),
    ...say('MULTIPLY BY 100 TO EXPRESS A PERCENTAGE', C.amber)
  );

  // 34 — Compare the two rates.
  await until(S(34));
  await play(
    new M.Indicate(
      rateBars[0],
      { color: NORTH }
    ),
    new M.Indicate(
      rateBars[1],
      { color: SOUTH }
    ),
    ...fbox([
      ['North: 0/1 = 0%', NORTH],
      ['South: 1/2 = 50%', SOUTH],
      'Original four-request audit'
    ]),
    ...say('NORTH: 0%     SOUTH: 50%')
  );

  // 35 — Does this establish that North always performs better?
  await until(S(35));
  await play(
    ...fbox([
      ['Only 1 urgent request in North', NORTH],
      ['Only 2 urgent requests in South', SOUTH],
      ['Would these rates stay the same?', C.amber]
    ], C.amber),
    ...say('DOES NORTH ALWAYS PERFORM BETTER?', C.amber)
  );

  // ------------------------------------------------------------
  // Sensitivity to one additional urgent request.
  //
  // Scenario 1: both new requests are caught.
  //
  // No risk values or pipe types are invented for the new homes.
  // They are hypothetical confirmed urgent requests.
  // ------------------------------------------------------------

  const NEW_SLOT = [
    BASE_COUNTS[0],
    BASE_COUNTS[1]
  ];

  const pendingCards = [
    urgentRequestCard(
      '',
      0,
      NEW_SLOT[0],
      null,
      true
    ),
    urgentRequestCard(
      '',
      1,
      NEW_SLOT[1],
      null,
      true
    )
  ];

  const caughtCards = [
    urgentRequestCard(
      '',
      0,
      NEW_SLOT[0],
      true,
      true
    ),
    urgentRequestCard(
      '',
      1,
      NEW_SLOT[1],
      true,
      true
    )
  ];

  const hypotheticalMissedCards = [
    urgentRequestCard(
      '',
      0,
      NEW_SLOT[0],
      false,
      true
    ),
    urgentRequestCard(
      '',
      1,
      NEW_SLOT[1],
      false,
      true
    )
  ];

  const hypotheticalRings = [
    missedRing(0, NEW_SLOT[0]),
    missedRing(1, NEW_SLOT[1])
  ];

  let currentNewCards = [];
  let currentNewRings = [];

  // 36 — Imagine one more confirmed urgent request per district.
  await until(S(36));

  currentNewCards = pendingCards.slice();

  await play(
    ...ins(currentNewCards),
    ...changeStatus(
      'IMAGINE ONE NEW URGENT REQUEST EACH',
      C.violet
    ),
    ...changeCount(
      0,
      CAUGHT_COUNTS[0]
    ),
    ...changeCount(
      1,
      CAUGHT_COUNTS[1]
    ),
    ...outs(rateBars),
    ...fbox([
      ['Add one confirmed urgent request to North', NORTH],
      ['Add one confirmed urgent request to South', SOUTH],
      'These are imagined requests'
    ], C.violet),
    ...say('ONE EXTRA URGENT REQUEST PER DISTRICT', C.violet)
  );

  rateBars = [null, null];

  // 37 — Suppose both new requests are caught.
  await until(S(37));
  await play(
    ...outs(currentNewCards),
    ...ins(caughtCards),
    ...changeStatus(
      'SCENARIO 1: BOTH NEW REQUESTS CAUGHT',
      C.green
    ),
    ...fbox([
      ['Both new requests are confirmed urgent', C.green],
      ['Both join today’s list', C.amber]
    ], C.green),
    ...say('SCENARIO 1: CATCH BOTH NEW REQUESTS', C.green)
  );

  currentNewCards = caughtCards.slice();

  // 38 — North now misses 0/2 = 0%.
  await until(S(38));
  await play(
    ...changeCount(
      0,
      CAUGHT_COUNTS[0],
      CAUGHT_MISSES[0]
    ),
    addRate(
      0,
      CAUGHT_MISSES[0],
      CAUGHT_COUNTS[0]
    ),
    new M.Indicate(
      currentNewCards[0],
      { color: C.green }
    ),
    ...fbox([
      ['North: 0 missed out of 2 urgent', NORTH],
      ['0 ÷ 2 × 100 = 0%', C.green]
    ], NORTH),
    ...say('NORTH NOW: 0 OUT OF 2 = 0%', NORTH)
  );

  // 39 — South now misses 1/3 ≈ 33%.
  await until(S(39));
  await play(
    ...changeCount(
      1,
      CAUGHT_COUNTS[1],
      CAUGHT_MISSES[1]
    ),
    addRate(
      1,
      CAUGHT_MISSES[1],
      CAUGHT_COUNTS[1]
    ),
    new M.Indicate(
      currentNewCards[1],
      { color: C.green }
    ),
    ...fbox([
      ['South: 1 missed out of 3 urgent', SOUTH],
      ['1 ÷ 3 × 100 ≈ 33%', RED],
      'Originally 50%'
    ], SOUTH),
    ...say('SOUTH NOW: 1 OUT OF 3 ≈ 33%', SOUTH)
  );

  // ------------------------------------------------------------
  // Scenario 2: restore the original audit first.
  //
  // Remove the previous hypothetical requests.
  // Restore the original counts and rates.
  // Then imagine a different result for the two new requests.
  // ------------------------------------------------------------

  // 40 — Return to the original four requests.
  await until(S(40));
  await play(
    ...outs(currentNewCards),
    ...changeCount(
      0,
      BASE_COUNTS[0],
      BASE_MISSES[0]
    ),
    ...changeCount(
      1,
      BASE_COUNTS[1],
      BASE_MISSES[1]
    ),
    ...updateRate(
      0,
      BASE_MISSES[0],
      BASE_COUNTS[0]
    ),
    ...updateRate(
      1,
      BASE_MISSES[1],
      BASE_COUNTS[1]
    ),
    ...changeStatus(
      'RESET TO THE ORIGINAL FOUR REQUESTS',
      C.violet
    ),
    ...fbox([
      ['Restore the original audit', C.violet],
      ['North: 0/1     South: 1/2', C.ink],
      'Now imagine another possibility'
    ], C.violet),
    ...say('RESET BEFORE TRYING A DIFFERENT RESULT', C.violet)
  );

  currentNewCards = [];

  // 41 — This time, both new urgent requests are missed.
  await until(S(41));

  currentNewCards = hypotheticalMissedCards.slice();
  currentNewRings = hypotheticalRings.slice();

  await play(
    ...ins(currentNewCards),
    ...ins(currentNewRings),
    ...outs(rateBars),
    ...changeCount(
      0,
      MISSED_COUNTS[0]
    ),
    ...changeCount(
      1,
      MISSED_COUNTS[1]
    ),
    ...changeStatus(
      'SCENARIO 2: BOTH NEW REQUESTS MISSED',
      RED
    ),
    ...fbox([
      ['Both new requests are confirmed urgent', C.green],
      ['Both are left off today’s list', RED]
    ], RED),
    ...say('SCENARIO 2: MISS BOTH NEW REQUESTS', RED)
  );

  rateBars = [null, null];

  // 42 — North now misses 1/2 = 50%.
  await until(S(42));
  await play(
    ...changeCount(
      0,
      MISSED_COUNTS[0],
      MISSED_MISSES[0]
    ),
    addRate(
      0,
      MISSED_MISSES[0],
      MISSED_COUNTS[0]
    ),
    new M.Indicate(
      currentNewRings[0],
      { color: RED }
    ),
    ...fbox([
      ['North: 1 missed out of 2 urgent', NORTH],
      ['1 ÷ 2 × 100 = 50%', RED],
      'Originally 0%'
    ], NORTH),
    ...say('NORTH NOW: 1 OUT OF 2 = 50%', NORTH)
  );

  // 43 — South now misses 2/3 ≈ 67%.
  await until(S(43));
  await play(
    ...changeCount(
      1,
      MISSED_COUNTS[1],
      MISSED_MISSES[1]
    ),
    addRate(
      1,
      MISSED_MISSES[1],
      MISSED_COUNTS[1]
    ),
    new M.Indicate(
      currentNewRings[1],
      { color: RED }
    ),
    ...fbox([
      ['South: 2 missed out of 3 urgent', SOUTH],
      ['2 ÷ 3 × 100 ≈ 67%', RED],
      'Originally 50%'
    ], SOUTH),
    ...say('SOUTH NOW: 2 OUT OF 3 ≈ 67%', SOUTH)
  );

  // ------------------------------------------------------------
  // Compare the original audit and the two imagined updates.
  //
  // The three columns represent separate scenarios.
  //
  // Original:
  //   North 0%, South 50%.
  //
  // Both new requests caught:
  //   North 0%, South approximately 33%.
  //
  // Both new requests missed:
  //   North 50%, South approximately 67%.
  //
  // These are illustrative outcomes, not confidence intervals
  // or bounds on the true missed-visit rates.
  // ------------------------------------------------------------

  // Laptop: three cards side by side, districts stacked inside.
  // Phone: three full-width cards stacked, districts side by side inside.
  const HISTORY_X = P
    ? [0, 0, 0]
    : [-3.95, 0, 3.95];

  const HISTORY_YS = P
    ? [1.95, 0.05, -1.85]
    : [-0.07, -0.07, -0.07];

  const HISTORY_W = P ? 6.70 : 3.60;
  const HISTORY_H = P ? 1.75 : 2.75;

  function scenarioCard(
    index,
    title,
    subtitle,
    counts,
    misses,
    color
  ) {
    const x = HISTORY_X[index];
    const cy = HISTORY_YS[index];
    const top = cy + HISTORY_H / 2;

    const bg = rect(
      HISTORY_W,
      HISTORY_H,
      [x, cy, 0],
      color,
      0,
      1.8,
      0.14
    );

    bg.setFill(C.card, 0.95);

    const head = txt(
      title,
      P ? 20 : 20,
      color,
      P ? [x - HISTORY_W * 0.24, top - 0.28, 0] : [x, top - 0.30, 0],
      false,
      P ? HISTORY_W * 0.45 : HISTORY_W - 0.15
    );

    const sub = txt(
      subtitle,
      P ? 16 : 15,
      C.muted,
      P ? [x + HISTORY_W * 0.22, top - 0.28, 0] : [x, top - 0.60, 0],
      false,
      P ? HISTORY_W * 0.45 : HISTORY_W - 0.17
    );

    const parts = [bg, head, sub];

    const districtParts = [];

    for (let g = 0; g < 2; g++) {
      // centre of this district's block
      const hx = P ? x + (g === 0 ? -1 : 1) * HISTORY_W / 4 : x;
      const y = P ? cy - 0.12 : [0.22, -0.88][g];
      const halfW = P ? HISTORY_W / 2 : HISTORY_W;

      const district = DISTRICT_COLORS[g];
      const v = rate(misses[g], counts[g]);

      const barW = halfW - (P ? 0.45 : 0.32);
      const barH = P ? 0.19 : 0.15;

      const barY = y - (P ? 0.33 : 0.33);

      const label = txt(
        GROUPS[g],
        P ? 18 : 18,
        district,
        [
          hx,
          y + (P ? 0.32 : 0.25),
          0
        ],
        false,
        halfW - 0.20
      );

      const fraction = txt(
        `${misses[g]}/${counts[g]}`,
        P ? 19 : 18,
        C.ink,
        [
          hx - halfW * 0.25,
          y,
          0
        ],
        true,
        halfW * 0.36
      );

      const valueText = txt(
        percent(v),
        P ? 22 : 22,
        v === 0 ? C.green : RED,
        [
          hx + halfW * 0.21,
          y,
          0
        ],
        true,
        halfW * 0.48
      );

      const track = solidRect(
        barW,
        barH,
        [hx, barY, 0],
        C.muted,
        0.14
      );

      const outline = rect(
        barW,
        barH,
        [hx, barY, 0],
        district,
        0,
        1.1,
        0.04
      );

      const row = [
        label,
        fraction,
        valueText,
        track,
        outline
      ];

      if (v > 0) {
        const w = barW * v / 100;

        row.push(
          solidRect(
            w,
            barH,
            [
              hx - barW / 2 + w / 2,
              barY,
              0
            ],
            RED,
            0.84
          )
        );
      } else {
        row.push(
          line(
            [
              hx - barW / 2,
              barY - barH / 2 - 0.025,
              0
            ],
            [
              hx - barW / 2,
              barY + barH / 2 + 0.025,
              0
            ],
            C.green,
            2.2
          )
        );
      }

      const scaleZero = txt(
        '0',
        15,
        C.muted,
        [
          hx - barW / 2,
          barY - 0.21,
          0
        ],
        true
      );

      const scaleHundred = txt(
        '100%',
        15,
        C.muted,
        [
          hx + barW / 2,
          barY - 0.21,
          0
        ],
        true
      );

      row.push(scaleZero, scaleHundred);

      const groupRow = new M.VGroup(...row);

      parts.push(groupRow);
      districtParts.push(groupRow);
    }

    return {
      group: new M.VGroup(...parts),
      districtParts
    };
  }

  const originalScenario = scenarioCard(
    0,
    'Original',
    'Observed requests',
    BASE_COUNTS,
    BASE_MISSES,
    C.muted
  );

  const caughtScenario = scenarioCard(
    1,
    'Both caught',
    'Imagined update',
    CAUGHT_COUNTS,
    CAUGHT_MISSES,
    C.green
  );

  const missedScenario = scenarioCard(
    2,
    'Both missed',
    'Imagined update',
    MISSED_COUNTS,
    MISSED_MISSES,
    RED
  );

  const scenarios = [
    originalScenario,
    caughtScenario,
    missedScenario
  ];

  const historyHeading = txt(
    'ONE EXTRA URGENT REQUEST IN EACH DISTRICT',
    P ? 18 : 20,
    C.ink,
    [0, P ? 3.15 : 1.53, 0],
    true,
    FW - 0.80
  );

  const scenarioNote = txt(
    'Two separate hypothetical updates',
    P ? 18 : 17,
    C.muted,
    [0, P ? -3.25 : -1.73, 0],
    false,
    FW - 0.80
  );

  function clearBasketPicture() {
    return outs([
      ...baskets,
      cardsA,
      cardsC,
      cardsD,
      ringD,
      ...basketCounts,
      ...rateBars,
      rateTitle,
      statusNow,
      ...currentNewCards,
      ...currentNewRings
    ]);
  }

  // 44 — One extra request can change the rates considerably.
  await until(S(44));
  await play(
    ...clearBasketPicture(),
    new M.FadeIn(historyHeading),
    lagIn(
      scenarios.map(s => s.group),
      1.35,
      0.15
    ),
    new M.FadeIn(scenarioNote),
    ...fbox([
      ['North: 0% or 50% in our imagined updates', NORTH],
      ['South: about 33% or 67%', SOUTH]
    ], C.amber),
    ...say('JUST ONE EXTRA REQUEST CAN CHANGE A RATE', C.amber)
  );

  // 45 — Too few requests to establish future performance.
  await until(S(45));
  await play(
    new M.Indicate(
      originalScenario.group,
      { color: C.amber }
    ),
    ...fbox([
      ['Only 3 confirmed urgent requests in total', C.amber],
      'Too little evidence for a reliable future rate'
    ], C.amber),
    ...say('WE HAVE VERY FEW URGENT REQUESTS', C.amber)
  );

  // 46 — Define uncertainty.
  await until(S(46));

  const uncertaintyTag = pill(
    'TRUE FUTURE RATES: ?',
    C.amber,
    P ? 20 : 19
  );

  uncertaintyTag.moveTo([
    0,
    P ? -3.25 : -1.72,
    0
  ]);

  await play(
    new M.FadeOut(scenarioNote),
    new M.FadeIn(uncertaintyTag),
    ...fbox([
      ['Uncertainty = lack of certainty', C.amber],
      'We do not know the true future rates'
    ], C.amber),
    ...say('THIS LACK OF CERTAINTY IS UNCERTAINTY', C.amber)
  );

  // 47 — Small groups can produce greatly changing rates.
  await until(S(47));
  await play(
    new M.LaggedStart([
      new M.Indicate(
        caughtScenario.group,
        { color: C.green }
      ),
      new M.Indicate(
        missedScenario.group,
        { color: RED }
      )
    ], { lagRatio: 0.25, runTime: 1.65 }),
    ...fbox([
      ['Small denominators', C.amber],
      ['One new request has a large effect', C.amber]
    ], C.amber),
    ...say('SMALL GROUPS CAN GIVE UNSTABLE RATES', C.amber)
  );

  // 48 — These examples do not give the full range of future rates.
  await until(S(48));
  await play(
    ...fbox([
      ['These are two illustrative scenarios', C.ink],
      ['They are NOT uncertainty intervals', C.amber],
      'Future rates could differ from both examples'
    ], C.amber),
    ...say('EXAMPLES, NOT BOUNDS ON FUTURE RATES', C.amber)
  );

  // ------------------------------------------------------------
  // Return to the observed data.
  //
  // Subgroup evaluation helps identify where further examination
  // may be needed. It is a starting point, not a fairness verdict.
  // ------------------------------------------------------------

  const SUMMARY_X = P ? 0 : -1.45;
  const SUMMARY_W = P ? 5.05 : 6.10;
  const SUMMARY_H = P ? 0.38 : 0.34;

  const SUMMARY_Y = P
    ? [1.30, -0.25, -1.80]
    : [0.87, -0.18, -1.23];

  const SUMMARY_LEFT =
    SUMMARY_X - SUMMARY_W / 2;

  function summaryBar(
    label,
    missed,
    urgent,
    index,
    color
  ) {
    const y = SUMMARY_Y[index];
    const value = rate(missed, urgent);

    const track = solidRect(
      SUMMARY_W,
      SUMMARY_H,
      [
        SUMMARY_X,
        y,
        0
      ],
      C.muted,
      0.14
    );

    const outline = rect(
      SUMMARY_W,
      SUMMARY_H,
      [
        SUMMARY_X,
        y,
        0
      ],
      color,
      0,
      1.5,
      0.05
    );

    const title = T(
      `${label}: ${missed}/${urgent}`,
      P ? 21 : 22,
      color
    );

    if (title.getWidth() > SUMMARY_W) {
      title.scale(
        SUMMARY_W / title.getWidth()
      );
    }

    title.moveTo([
      SUMMARY_LEFT + title.getWidth() / 2,
      y + 0.42,
      0
    ]);

    const valueText = txt(
      percent(value),
      P ? 25 : 25,
      value === 0 ? C.green : RED,
      [
        SUMMARY_LEFT + SUMMARY_W + 0.62,
        y,
        0
      ],
      true,
      1.12
    );

    const parts = [
      track,
      outline,
      title,
      valueText
    ];

    if (value > 0) {
      const w = SUMMARY_W * value / 100;

      parts.push(
        solidRect(
          w,
          SUMMARY_H,
          [
            SUMMARY_LEFT + w / 2,
            y,
            0
          ],
          RED,
          0.84
        )
      );
    } else {
      parts.push(
        line(
          [
            SUMMARY_LEFT,
            y - SUMMARY_H / 2 - 0.06,
            0
          ],
          [
            SUMMARY_LEFT,
            y + SUMMARY_H / 2 + 0.06,
            0
          ],
          C.green,
          2.7
        )
      );
    }

    const scale = [
      txt(
        '0%',
        13,
        C.muted,
        [
          SUMMARY_LEFT,
          y - SUMMARY_H / 2 - 0.18,
          0
        ],
        true
      ),
      txt(
        '100%',
        13,
        C.muted,
        [
          SUMMARY_LEFT + SUMMARY_W,
          y - SUMMARY_H / 2 - 0.18,
          0
        ],
        true
      )
    ];

    return new M.VGroup(
      ...parts,
      ...scale
    );
  }

  const summaryNorth = summaryBar(
    'North',
    BASE_MISSES[0],
    BASE_COUNTS[0],
    0,
    NORTH
  );

  const summarySouth = summaryBar(
    'South',
    BASE_MISSES[1],
    BASE_COUNTS[1],
    1,
    SOUTH
  );

  const summaryOverall = summaryBar(
    'All districts together',
    OVERALL_MISSES,
    OVERALL_COUNT,
    2,
    C.ink
  );

  const summaryHeading = txt(
    'ORIGINAL HISTORICAL AUDIT',
    P ? 21 : 21,
    C.ink,
    [
      SUMMARY_X,
      P ? 2.72 : 1.53,
      0
    ],
    true,
    P ? 6.70 : 7.10
  );

  const EXAMINE_POS = P
    ? [0, -2.43, 0]
    : [4.55, -0.06, 0];

  const EXAMINE_W = P ? 4.65 : 3.32;
  const EXAMINE_H = P ? 0.78 : 1.92;

  function examinationCard() {
    const x = EXAMINE_POS[0];
    const y = EXAMINE_POS[1];

    const bg = rect(
      EXAMINE_W,
      EXAMINE_H,
      EXAMINE_POS,
      SOUTH,
      0,
      1.9,
      0.14
    );

    bg.setFill(C.card, 0.95);

    const title = txt(
      'LOOK MORE CLOSELY',
      P ? 17 : 19,
      SOUTH,
      [
        x,
        y + (P ? 0.17 : 0.56),
        0
      ],
      true,
      EXAMINE_W - 0.25
    );

    const note = txt(
      'South: investigate Home D',
      P ? 17 : 18,
      C.ink,
      [
        x,
        y - (P ? 0.16 : 0.02),
        0
      ],
      false,
      EXAMINE_W - 0.25
    );

    const parts = [bg, title, note];

    if (!P) {
      parts.push(
        txt(
          'Collect more evidence',
          16,
          C.muted,
          [
            x,
            y - 0.57,
            0
          ],
          false,
          EXAMINE_W - 0.25
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const examineSouth = examinationCard();

  // 49 — Subgroup evaluation identifies groups needing closer review.
  await until(S(49));
  await play(
    ...outs([
      ...scenarios.map(s => s.group),
      historyHeading,
      uncertaintyTag
    ]),
    new M.FadeIn(summaryHeading),
    new M.FadeIn(summaryNorth),
    new M.FadeIn(summarySouth),
    new M.FadeIn(examineSouth),
    ...fbox([
      ['South has a missed urgent visit in this audit', SOUTH],
      'Investigate why it happened'
    ], SOUTH),
    ...say('FIND GROUPS THAT NEED CLOSER EXAMINATION', C.violet)
  );

  // 50 — An overall rate can hide a subgroup problem.
  await until(S(50));
  await play(
    new M.FadeOut(examineSouth),
    new M.FadeIn(summaryOverall),
    ...fbox([
      ['All districts: 1/3 ≈ 33%', C.ink],
      ['North: 0/1 = 0%', NORTH],
      ['South: 1/2 = 50%', SOUTH]
    ]),
    ...say('AN OVERALL RATE CAN HIDE GROUP DIFFERENCES')
  );

  // ------------------------------------------------------------
  // Fairness caution and next steps.
  //
  // The observed rate difference is descriptive.
  // It does not establish unfair treatment or its cause.
  // ------------------------------------------------------------

  const cautionPos = P
    ? [0, -2.87, 0]
    : [4.55, -0.05, 0];

  const cautionW = P ? 5.80 : 3.35;
  const cautionH = P ? 0.86 : 2.05;

  function cautionCard() {
    const x = cautionPos[0];
    const y = cautionPos[1];

    const bg = rect(
      cautionW,
      cautionH,
      cautionPos,
      C.amber,
      0,
      1.8,
      0.14
    );

    bg.setFill(C.card, 0.96);

    const head = txt(
      'DIFFERENCE ≠ PROOF',
      P ? 19 : 20,
      C.amber,
      [
        x,
        y + (P ? 0.19 : 0.55),
        0
      ],
      true,
      cautionW - 0.22
    );

    const note = txt(
      'Too little evidence to conclude unfairness',
      P ? 16 : 17,
      C.ink,
      [
        x,
        y - (P ? 0.17 : 0.02),
        0
      ],
      false,
      cautionW - 0.22
    );

    const parts = [bg, head, note];

    if (!P) {
      parts.push(
        txt(
          'Investigate further',
          17,
          C.muted,
          [
            x,
            y - 0.57,
            0
          ],
          false,
          cautionW - 0.22
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const caution = cautionCard();

  // 51 — A small-group difference does not prove unfair treatment.
  await until(S(51));
  await play(
    new M.FadeIn(caution),
    ...fbox([
      ['An observed difference is a reason to investigate', C.amber],
      ['It is not proof that the model treats groups unfairly', C.ink]
    ], C.amber),
    ...say('A SMALL-GROUP DIFFERENCE DOES NOT PROVE UNFAIRNESS', C.amber)
  );

  // ------------------------------------------------------------
  // Collect more evidence.
  //
  // Empty record outlines represent future data collection.
  // They are not counted as observed or confirmed urgent visits.
  // No fabricated future rates are displayed.
  // ------------------------------------------------------------

  const COLLECT_X = P ? 0 : 4.55;
  const COLLECT_Y = P ? -2.88 : -0.08;

  function futureEvidence() {
    const w = P ? 6.25 : 3.50;
    const h = P ? 0.90 : 2.10;

    const bg = rect(
      w,
      h,
      [COLLECT_X, COLLECT_Y, 0],
      C.green,
      0,
      1.8,
      0.13
    );

    bg.setFill(C.card, 0.96);

    const title = txt(
      'COLLECT MORE REQUESTS',
      P ? 17 : 18,
      C.green,
      [
        COLLECT_X,
        COLLECT_Y + (P ? 0.22 : 0.65),
        0
      ],
      true,
      w - 0.22
    );

    const parts = [bg, title];

    if (P) {
      parts.push(
        txt(
          'North + South: compare again with more evidence',
          16,
          C.ink,
          [
            COLLECT_X,
            COLLECT_Y - 0.18,
            0
          ],
          false,
          w - 0.25
        )
      );
    } else {
      for (let g = 0; g < 2; g++) {
        const y = COLLECT_Y + 0.12 - g * 0.58;
        const color = DISTRICT_COLORS[g];

        const name = txt(
          GROUPS[g],
          16,
          color,
          [
            COLLECT_X - 0.97,
            y,
            0
          ],
          false,
          0.95
        );

        parts.push(name);

        for (let k = 0; k < 3; k++) {
          const x = COLLECT_X + 0.02 + k * 0.46;

          const slot = rect(
            0.34,
            0.38,
            [x, y, 0],
            color,
            0.04,
            1.2,
            0.05
          );

          const q = txt(
            '?',
            15,
            C.muted,
            [x, y, 0],
            true
          );

          parts.push(slot, q);
        }
      }

      parts.push(
        txt(
          'Recheck the difference',
          15,
          C.ink,
          [
            COLLECT_X,
            COLLECT_Y - 0.82,
            0
          ],
          false,
          w - 0.25
        )
      );
    }

    return new M.VGroup(...parts);
  }

  const collectMore = futureEvidence();

  // 52 — Collect more requests and check whether the difference persists.
  await until(S(52));
  await play(
    new M.FadeOut(caution),
    new M.FadeIn(collectMore),
    ...fbox([
      ['Collect more requests from both districts', C.green],
      'Check whether the performance difference continues'
    ], C.green),
    ...say('COLLECT MORE DATA AND CHECK AGAIN', C.green)
  );

  // ------------------------------------------------------------
  // Final picture.
  //
  // Restore the observed North and South results as the main
  // comparison. Keep the small sample sizes visible.
  //
  // Subgroup evaluation compares performance across groups.
  // Small groups require cautious interpretation.
  // ------------------------------------------------------------

  const FINAL_X = P ? 0 : 0;

  const FINAL_W = P ? 6.55 : 9.20;
  const FINAL_H = P ? 4.45 : 2.95;

  const FINAL_Y = P ? 0.95 : -0.02;

  function finalDistrict(
    group,
    x,
    y,
    w,
    h
  ) {
    const color = DISTRICT_COLORS[group];

    const missed = BASE_MISSES[group];
    const urgent = BASE_COUNTS[group];
    const value = BASE_RATES[group];

    const bg = rect(
      w,
      h,
      [x, y, 0],
      color,
      0,
      2,
      0.15
    );

    bg.setFill(C.card, 0.95);

    const title = txt(
      GROUPS[group].toUpperCase(),
      P ? 23 : 25,
      color,
      [
        x,
        y + h * 0.35,
        0
      ],
      true,
      w - 0.25
    );

    const fraction = txt(
      `${missed} missed / ${urgent} urgent`,
      P ? 18 : 20,
      C.ink,
      [
        x,
        y + h * 0.12,
        0
      ],
      false,
      w - 0.25
    );

    const val = txt(
      percent(value),
      P ? 36 : 36,
      value === 0 ? C.green : RED,
      [
        x,
        y - h * 0.10,
        0
      ],
      true,
      w - 0.30
    );

    const barW = w - 0.48;
    const barH = P ? 0.23 : 0.24;
    const barY = y - h * 0.30;

    const track = solidRect(
      barW,
      barH,
      [x, barY, 0],
      C.muted,
      0.14
    );

    const outline = rect(
      barW,
      barH,
      [x, barY, 0],
      color,
      0,
      1.4,
      0.05
    );

    const parts = [
      bg,
      title,
      fraction,
      val,
      track,
      outline
    ];

    if (value > 0) {
      const fillW = barW * value / 100;

      parts.push(
        solidRect(
          fillW,
          barH,
          [
            x - barW / 2 + fillW / 2,
            barY,
            0
          ],
          RED,
          0.84
        )
      );
    } else {
      parts.push(
        line(
          [
            x - barW / 2,
            barY - barH / 2 - 0.045,
            0
          ],
          [
            x - barW / 2,
            barY + barH / 2 + 0.045,
            0
          ],
          C.green,
          2.6
        )
      );
    }

    parts.push(
      txt(
        '0%',
        12,
        C.muted,
        [
          x - barW / 2,
          barY - 0.24,
          0
        ],
        true
      ),
      txt(
        '100%',
        12,
        C.muted,
        [
          x + barW / 2,
          barY - 0.24,
          0
        ],
        true
      )
    );

    return new M.VGroup(...parts);
  }

  const FINAL_CARD_W = P ? 3.13 : 4.25;
  const FINAL_CARD_H = P ? 3.10 : 2.25;
  const FINAL_SP = P ? 3.45 : 4.70;

  const finalNorth = finalDistrict(
    0,
    FINAL_X - FINAL_SP / 2,
    FINAL_Y,
    FINAL_CARD_W,
    FINAL_CARD_H
  );

  const finalSouth = finalDistrict(
    1,
    FINAL_X + FINAL_SP / 2,
    FINAL_Y,
    FINAL_CARD_W,
    FINAL_CARD_H
  );

  const finalHeading = txt(
    'SUBGROUP EVALUATION',
    P ? 25 : 25,
    C.violet,
    [
      0,
      P ? 3.02 : 1.42,
      0
    ],
    true,
    FW - 0.70
  );

  const finalCaution = pill(
    'SMALL GROUPS: INTERPRET CAREFULLY',
    C.amber,
    P ? 18 : 19
  );

  finalCaution.moveTo([
    0,
    P ? -1.48 : -1.57,
    0
  ]);

  // 53 — Compare performance across groups, interpreting small
  // groups carefully.
  await until(S(53));
  await play(
    ...outs([
      summaryHeading,
      summaryNorth,
      summarySouth,
      summaryOverall,
      collectMore
    ]),
    new M.FadeIn(finalHeading),
    new M.FadeIn(finalNorth),
    new M.FadeIn(finalSouth),
    new M.FadeIn(finalCaution),
    ...fbox([
      ['Compare model performance across groups', C.violet],
      ['Missed rate = missed urgent ÷ confirmed urgent', C.ink],
      ['Small groups require careful interpretation', C.amber]
    ], C.violet),
    ...say('COMPARE GROUPS. INTERPRET SMALL SAMPLES CAREFULLY.', C.violet)
  );
}
