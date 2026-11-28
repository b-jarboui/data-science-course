// lesson 11.3.2
// Horizon-specific error.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  const D = [40, 41, 44, 42, 44, 45, 48, 46, 49, 48, 50, 52];

  const TARGETS = [9, 10, 11, 12];

  const ONE = {
    origins: [8, 9, 10, 11],
    forecasts: [46, 49, 48, 50],
    actuals: [49, 48, 50, 52],
    misses: [3, 1, 2, 2],
    total: 8,
    mean: 2
  };

  const FOUR = {
    origins: [5, 6, 7, 8],
    forecasts: [44, 45, 48, 46],
    actuals: [49, 48, 50, 52],
    misses: [5, 3, 2, 6],
    total: 16,
    mean: 4
  };

  const SHORT = C.amber;
  const LONG = C.violet;

  // Responsive layout.
  // Phone: 8 × 14.22, content between y=-5.5 and y=4.3.
  // Laptop: 14.22 × 8, content between y=-3.0 and y=2.3.

  const CX = P ? 0.20 : -2.50;
  const SP = P ? (FW - 1.95) / 11 : 0.68;
  const BASE = P ? -2.4 : -1.75;
  const UNIT = P ? 0.30 : 0.16;

  const PILL = P ? [0, 3.65, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -5.0, 0] : [4.15, -0.35, 0];

  const x = w => CX + (w - 6.5) * SP;
  const y = v => BASE + (v - 40) * UNIT;
  const pt = (w, v) => [x(w), y(v), 0];

  const LEFT = x(1) - SP / 2;
  const RIGHT = x(12) + SP / 2;
  const BOTTOM = BASE - 0.28;
  const TOP = y(52) + 0.35;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fadeIn = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  function txt(
    s, size, color, p,
    mono = false,
    maxw = FW - 1.1
  ) {
    const t = T(String(s), size, color, mono);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(p);

    return t;
  }

  function rect(
    width, height, p,
    color,
    opacity = 0,
    strokeWidth = 2
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.10,
      color,
      strokeWidth
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

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function arrowHead(a, b, color, size = 0.14) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / len;
    const uy = dy / len;
    const wing = size * 0.48;

    return [
      line(
        b,
        [
          b[0] - size * ux + wing * uy,
          b[1] - size * uy - wing * ux,
          0
        ],
        color,
        2.5
      ),
      line(
        b,
        [
          b[0] - size * ux - wing * uy,
          b[1] - size * uy + wing * ux,
          0
        ],
        color,
        2.5
      )
    ];
  }

  function arrow(a, b, color, strokeWidth = 3) {
    return new M.VGroup(
      line(a, b, color, strokeWidth),
      ...arrowHead(a, b, color)
    );
  }

  // Formula box, following the approved lesson's structure.

  let boxNow = null;

  function fbox(lines, color = C.cyan, position = BOXP) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.97);
    r.moveTo(position);

    const left = position[0] - wd / 2 + 0.35;

    const top =
      position[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.25;

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

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];

    boxNow = null;

    return a;
  }

  // ------------------------------------------------------------
  // 0–3: North orders water from two suppliers.
  // ------------------------------------------------------------

  function waterCase(cx, cy, scale = 1) {
    const parts = [];

    for (let k = 0; k < 3; k++) {
      const bx = cx + (k - 1) * 0.42 * scale;

      const body = rect(
        0.31 * scale,
        0.84 * scale,
        [bx, cy + 0.17 * scale, 0],
        C.cyan,
        0.30
      );

      const neck = rect(
        0.14 * scale,
        0.21 * scale,
        [bx, cy + 0.65 * scale, 0],
        C.cyan,
        0.45
      );

      const cap = rect(
        0.20 * scale,
        0.10 * scale,
        [bx, cy + 0.80 * scale, 0],
        C.ink,
        0.9,
        1
      );

      const band = rect(
        0.29 * scale,
        0.20 * scale,
        [bx, cy + 0.18 * scale, 0],
        C.cyan,
        0.85,
        1
      );

      parts.push(body, neck, cap, band);
    }

    const crate = rect(
      1.48 * scale,
      0.62 * scale,
      [cx, cy - 0.29 * scale, 0],
      C.cyan,
      0.20
    );

    parts.push(crate);

    return new M.VGroup(...parts);
  }

  const INTROY = P ? 1.15 : 0.2;

  const northCase = waterCase(0, INTROY - 0.15);

  const northTag = pill(
    'NORTH',
    C.cyan,
    22
  );

  northTag.moveTo([0, INTROY + 1.02, 0]);

  const SUPY = P ? -1.65 : -1.95;
  const SUPX = P ? 1.83 : 2.75;

  function supplierCard(cx, cy, horizon, color, name) {
    const wd = P ? 3.02 : 3.7;
    const ht = P ? 2.05 : 1.75;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo([cx, cy, 0]);

    const title = txt(
      name,
      P ? 18 : 20,
      C.ink,
      [cx, cy + 0.57, 0],
      true,
      wd - 0.3
    );

    const number = txt(
      horizon,
      P ? 38 : 36,
      color,
      [cx, cy + 0.02, 0],
      true
    );

    const unit = txt(
      horizon === 1 ? 'week ahead' : 'weeks ahead',
      P ? 19 : 18,
      color,
      [cx, cy - 0.59, 0]
    );

    return new M.VGroup(r, title, number, unit);
  }

  const supplier1 = supplierCard(
    -SUPX, SUPY,
    1, SHORT,
    'SUPPLIER A'
  );

  const supplier4 = supplierCard(
    SUPX, SUPY,
    4, LONG,
    'SUPPLIER B'
  );

  const link1 = arrow(
    [-0.75, INTROY - 0.55, 0],
    [-SUPX, SUPY + (P ? 1.14 : 1.0), 0],
    SHORT
  );

  const link4 = arrow(
    [0.75, INTROY - 0.55, 0],
    [SUPX, SUPY + (P ? 1.14 : 1.0), 0],
    LONG
  );

  await until(S(0));
  await play(
    new M.FadeIn(northCase),
    new M.FadeIn(northTag),
    ...say('NORTH: TWO WATER SUPPLIERS')
  );

  await until(S(1));
  await play(
    new M.FadeIn(supplier1),
    new M.FadeIn(link1),
    ...say('SUPPLIER A: 1 WEEK AHEAD', SHORT)
  );

  await until(S(2));
  await play(
    new M.FadeIn(supplier4),
    new M.FadeIn(link4),
    ...say('SUPPLIER B: 4 WEEKS AHEAD', LONG)
  );

  await until(S(3));
  await play(
    new M.Indicate(supplier1, { color: SHORT }),
    new M.Indicate(supplier4, { color: LONG }),
    ...say('WHICH DISTANCE GIVES BIGGER MISSES?', C.amber)
  );

  // ------------------------------------------------------------
  // 4: Draw North's demand as glowing dots over twelve weeks.
  // ------------------------------------------------------------

  const chartParts = [];
  const actualDots = [];

  const chartTitle = txt(
    'NORTH: CASES WANTED',
    P ? 22 : 21,
    C.cyan,
    [CX, P ? 3.05 : 1.43, 0],
    true
  );

  chartParts.push(chartTitle);

  const floor = line(
    [LEFT, BOTTOM, 0],
    [RIGHT, BOTTOM, 0],
    C.muted,
    2
  );

  chartParts.push(floor);

  for (let w = 1; w <= 12; w++) {
    const slot = line(
      [x(w), BOTTOM, 0],
      [x(w), TOP, 0],
      C.muted,
      0.65
    );

    const tick = line(
      [x(w), BOTTOM - 0.045, 0],
      [x(w), BOTTOM + 0.045, 0],
      C.muted,
      1.5
    );

    const lab = txt(
      w,
      P ? 15 : 16,
      C.muted,
      [x(w), BOTTOM - 0.23, 0],
      true,
      SP * 0.85
    );

    chartParts.push(slot, tick, lab);
  }

  for (const v of [40, 44, 48, 52]) {
    const guide = line(
      [LEFT, y(v), 0],
      [RIGHT, y(v), 0],
      C.muted,
      0.7
    );

    const lab = txt(
      v,
      P ? 15 : 16,
      C.muted,
      [
        LEFT - (P ? 0.25 : 0.31),
        y(v),
        0
      ],
      true
    );

    chartParts.push(guide, lab);
  }

  const weekLabel = txt(
    'week',
    16,
    C.muted,
    [CX, BOTTOM - 0.57, 0]
  );

  chartParts.push(weekLabel);

  function actual(w, value) {
    const p = pt(w, value);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.15 : 0.16,
      color: C.cyan
    });

    halo.setFill(C.cyan, 0.17);

    const dot = new M.Dot({
      point: p,
      radius: P ? 0.068 : 0.075,
      color: C.cyan
    });

    const lab = txt(
      value,
      P ? 15 : 15,
      C.cyan,
      [p[0], p[1] + 0.21, 0],
      true,
      SP * 0.85
    );

    return new M.VGroup(halo, dot, lab);
  }

  for (let w = 1; w <= 12; w++) {
    actualDots.push(actual(w, D[w - 1]));
  }

  await until(S(4));
  await play(
    ...fadeOut([
      northCase,
      northTag,
      supplier1,
      supplier4,
      link1,
      link4
    ]),
    ...fadeIn(chartParts),
    new M.LaggedStart(
      actualDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.07, runTime: 1.6 }
    ),
    ...say('12 WEEKS OF DEMAND AT NORTH')
  );

  // ------------------------------------------------------------
  // 5–9: Two forecast horizons, one target week.
  // ------------------------------------------------------------

  function targetCircle(w) {
    const c = new M.Circle({
      radius: P ? 0.145 : 0.15,
      color: C.green,
      strokeWidth: 2.5
    });

    c.setFill(C.green, 0);
    c.moveTo(pt(w, D[w - 1]));

    return c;
  }

  function originCircle(w, color) {
    const c = new M.Circle({
      radius: P ? 0.14 : 0.15,
      color,
      strokeWidth: 2.5
    });

    c.setFill(color, 0);
    c.moveTo(pt(w, D[w - 1]));

    return c;
  }

  // Horizon arrows use distinct horizontal spans.
  // Their endpoints are the origin and target columns.
  // The final arrowhead points into the actual target dot.

  function horizonArrow(origin, target, color, lane) {
    const start = pt(origin, D[origin - 1]);
    const end = pt(target, D[target - 1]);

    const a = [
      start[0],
      start[1] + 0.32,
      0
    ];

    const b = [
      start[0],
      lane,
      0
    ];

    const c = [
      end[0],
      lane,
      0
    ];

    const d = [
      end[0],
      end[1] + 0.30,
      0
    ];

    const horizon = target - origin;

    const label = txt(
      horizon === 1 ? '1 week' : `${horizon} weeks`,
      P ? 15 : 17,
      color,
      [
        (start[0] + end[0]) / 2,
        lane + 0.20,
        0
      ],
      true,
      Math.max(
        P ? 0.85 : 1.0,
        horizon * SP - 0.05
      )
    );

    return new M.VGroup(
      line(a, b, color, 2),
      line(b, c, color, 3),
      line(c, d, color, 2),
      ...arrowHead(c, d, color, 0.12),
      label
    );
  }

  const SHORTLANE = P ? 1.95 : 0.5;
  const LONGLANE = P ? 2.48 : 0.85;

  let target = targetCircle(9);

  let oneOrigin = originCircle(8, SHORT);
  let fourOrigin = originCircle(5, LONG);

  let oneArrow = horizonArrow(
    8, 9,
    SHORT,
    SHORTLANE
  );

  let fourArrow = horizonArrow(
    5, 9,
    LONG,
    LONGLANE
  );

  await until(S(5));
  await play(
    new M.Create(target),
    ...fbox([
      ['target: week 9', C.green],
      ['actual = 49 cases', C.cyan]
    ], C.green),
    ...say('WEEK 9: 49 CASES', C.green)
  );

  await until(S(6));
  await play(
    new M.Create(oneOrigin),
    new M.FadeIn(oneArrow),
    ...say('FROM WEEK 8 TO WEEK 9', SHORT)
  );

  await until(S(7));
  await play(
    new M.Create(fourOrigin),
    new M.FadeIn(fourArrow),
    ...say('FROM WEEK 5 TO WEEK 9', LONG)
  );

  await until(S(8));
  await play(
    new M.Indicate(oneArrow, { color: SHORT }),
    new M.Indicate(fourArrow, { color: LONG }),
    ...fbox([
      ['horizon', C.green],
      'how far ahead',
      'we make the guess',
      ['1 week or 4 weeks', C.amber]
    ], C.green),
    ...say('HORIZON = HOW FAR AHEAD', C.green)
  );

  await until(S(9));
  await play(
    new M.Indicate(target, { color: C.green }),
    ...fbox([
      ['same target week', C.green],
      ['week 9 = 49 cases', C.cyan],
      'two different origins'
    ], C.green),
    ...say('TARGET = THE WEEK BEING FORECAST', C.green)
  );

  // ------------------------------------------------------------
  // 10–11: The naive rule at both ordering distances.
  // ------------------------------------------------------------

  const ruleTag = pill(
    'COPY THE LAST KNOWN COUNT',
    C.amber,
    P ? 18 : 17
  );

  ruleTag.moveTo([
    CX,
    P ? -3.75 : -3.05,
    0
  ]);

  await until(S(10));
  await play(
    new M.FadeIn(ruleTag),
    new M.Indicate(actualDots[7], { color: SHORT }),
    new M.Indicate(actualDots[4], { color: LONG }),
    ...say('COPY THE COUNT AT EACH ORIGIN', C.amber)
  );

  await until(S(11));
  await play(
    ...fbox([
      ['naive forecast', C.amber],
      'forecast =',
      'last known count'
    ], C.amber),
    ...say('SAME RULE: THE NAIVE FORECAST', C.amber)
  );

  // ------------------------------------------------------------
  // 12–15: Compare forecasts for the same week-nine target.
  // Filled cyan dot = actual.
  // Hollow dot = forecast.
  // Vertical line = miss.
  // ------------------------------------------------------------

  function forecast(w, value, color) {
    const p = pt(w, value);

    const ring = new M.Circle({
      radius: P ? 0.087 : 0.092,
      color,
      strokeWidth: 3
    });

    ring.setFill(color, 0);
    ring.moveTo(p);

    return ring;
  }

  function copyGuide(origin, target, value, color) {
    return dashed(
      [
        x(origin) + 0.11,
        y(value),
        0
      ],
      [
        x(target) - 0.10,
        y(value),
        0
      ],
      color
    );
  }

  function gap(w, predicted, observed, color) {
    return line(
      pt(w, predicted),
      pt(w, observed),
      color,
      3.5
    );
  }

  const f1 = forecast(9, 46, SHORT);

  const copy1 = copyGuide(
    8, 9, 46, SHORT
  );

  const gap1 = gap(
    9, 46, 49, SHORT
  );

  await until(S(12));
  await play(
    new M.FadeOut(ruleTag),
    new M.Create(copy1),
    new M.FadeIn(f1),
    ...fbox([
      ['1 week ahead', SHORT],
      'origin: week 8',
      ['forecast = 46', SHORT]
    ], SHORT),
    ...say('WEEK 8 GIVES US 46', SHORT)
  );

  await until(S(13));
  await play(
    new M.Create(gap1),
    ...fbox([
      ['1 week ahead', SHORT],
      'actual   = 49',
      'forecast = 46',
      ['49 − 46 = 3 cases', SHORT]
    ], SHORT),
    ...say('ONE-WEEK MISS: 3 CASES', SHORT)
  );

  let f4 = forecast(9, 44, LONG);

  let copy4 = copyGuide(
    5, 9, 44, LONG
  );

  let gap4 = gap(
    9, 44, 49, LONG
  );

  await until(S(14));
  await play(
    new M.FadeOut(copy1),
    new M.FadeOut(gap1),
    new M.Create(copy4),
    new M.FadeIn(f4),
    ...fbox([
      ['4 weeks ahead', LONG],
      'origin: week 5',
      ['forecast = 44', LONG]
    ], LONG),
    ...say('WEEK 5 GIVES US 44', LONG)
  );

  await until(S(15));
  await play(
    new M.Create(gap4),
    ...fbox([
      ['same actual: 49', C.cyan],
      ['1 week:  49 − 46 = 3', SHORT],
      ['4 weeks: 49 − 44 = 5', LONG]
    ], LONG),
    ...say('FOUR-WEEK MISS: 5 CASES', LONG)
  );

  // ------------------------------------------------------------
  // 16–18: Keep the horizon at four weeks.
  // Move the origin and target together to weeks 6 and 10.
  // ------------------------------------------------------------

  const missedWeeks = [];

  function missBadge(w, n, color = LONG) {
    const r = rect(
      SP * 0.82,
      P ? 0.39 : 0.34,
      [
        x(w),
        BOTTOM - (P ? 0.95 : 0.83),
        0
      ],
      color,
      0.13,
      1.5
    );

    const t = txt(
      n,
      P ? 17 : 17,
      color,
      [
        x(w),
        BOTTOM - (P ? 0.95 : 0.83),
        0
      ],
      true
    );

    return new M.VGroup(r, t);
  }

  missedWeeks[0] = missBadge(9, 5);

  function moveFour(origin, targetWeek) {
    return [
      new M.Transform(
        fourOrigin,
        originCircle(origin, LONG)
      ),
      new M.Transform(
        fourArrow,
        horizonArrow(
          origin,
          targetWeek,
          LONG,
          LONGLANE
        )
      ),
      new M.Transform(
        target,
        targetCircle(targetWeek)
      )
    ];
  }

  await until(S(16));
  await play(
    ...fadeOut([
      oneArrow,
      oneOrigin,
      f1,
      f4,
      copy4,
      gap4
    ]),
    new M.FadeIn(missedWeeks[0]),
    ...moveFour(6, 10),
    ...fbox([
      ['4 weeks ahead', LONG],
      'origin: week 6',
      'target: week 10'
    ], LONG),
    ...say('MOVE BOTH ENDS FORWARD ONE WEEK', LONG)
  );

  f4 = forecast(10, 45, LONG);
  copy4 = copyGuide(6, 10, 45, LONG);

  await until(S(17));
  await play(
    new M.Create(copy4),
    new M.FadeIn(f4),
    ...fbox([
      ['origin: week 6', LONG],
      ['forecast = 45', LONG]
    ], LONG),
    ...say('WEEK 10 FORECAST: 45', LONG)
  );

  gap4 = gap(10, 45, 48, LONG);
  missedWeeks[1] = missBadge(10, 3);

  await until(S(18));
  await play(
    new M.Create(gap4),
    new M.FadeIn(missedWeeks[1]),
    ...fbox([
      ['target: week 10', C.green],
      'actual   = 48',
      'forecast = 45',
      ['48 − 45 = 3 cases', LONG]
    ], LONG),
    ...say('WEEK 10 MISS: 3 CASES', LONG)
  );

  // ------------------------------------------------------------
  // 19–20: Four weeks ahead of week eleven.
  // ------------------------------------------------------------

  const oldF10 = f4;
  const oldCopy10 = copy4;
  const oldGap10 = gap4;

  f4 = forecast(11, 48, LONG);
  copy4 = copyGuide(7, 11, 48, LONG);

  await until(S(19));
  await play(
    ...fadeOut([
      oldF10,
      oldCopy10,
      oldGap10
    ]),
    ...moveFour(7, 11),
    new M.Create(copy4),
    new M.FadeIn(f4),
    ...fbox([
      ['4 weeks ahead', LONG],
      'origin: week 7',
      'target: week 11',
      ['forecast = 48', LONG]
    ], LONG),
    ...say('WEEK 11: COPY 48 FROM WEEK 7', LONG)
  );

  gap4 = gap(11, 48, 50, LONG);
  missedWeeks[2] = missBadge(11, 2);

  await until(S(20));
  await play(
    new M.Create(gap4),
    new M.FadeIn(missedWeeks[2]),
    ...fbox([
      ['target: week 11', C.green],
      'actual   = 50',
      'forecast = 48',
      ['50 − 48 = 2 cases', LONG]
    ], LONG),
    ...say('WEEK 11 MISS: 2 CASES', LONG)
  );

  // ------------------------------------------------------------
  // 21–22: Four weeks ahead of week twelve.
  // ------------------------------------------------------------

  const oldF11 = f4;
  const oldCopy11 = copy4;
  const oldGap11 = gap4;

  f4 = forecast(12, 46, LONG);
  copy4 = copyGuide(8, 12, 46, LONG);

  await until(S(21));
  await play(
    ...fadeOut([
      oldF11,
      oldCopy11,
      oldGap11
    ]),
    ...moveFour(8, 12),
    new M.Create(copy4),
    new M.FadeIn(f4),
    ...fbox([
      ['4 weeks ahead', LONG],
      'origin: week 8',
      'target: week 12',
      ['forecast = 46', LONG]
    ], LONG),
    ...say('WEEK 12: COPY 46 FROM WEEK 8', LONG)
  );

  gap4 = gap(12, 46, 52, LONG);
  missedWeeks[3] = missBadge(12, 6);

  await until(S(22));
  await play(
    new M.Create(gap4),
    new M.FadeIn(missedWeeks[3]),
    ...fbox([
      ['target: week 12', C.green],
      'actual   = 52',
      'forecast = 46',
      ['52 − 46 = 6 cases', LONG]
    ], LONG),
    ...say('WEEK 12 MISS: 6 CASES', LONG)
  );

  // ------------------------------------------------------------
  // 23–25: Line up the four-week misses.
  // Each block represents one case missed.
  // Add all sixteen blocks, then share equally.
  // ------------------------------------------------------------

  const SCX = P ? 0 : -2.65;
  const SSP = P ? 1.48 : 1.48;
  const SBW = P ? 0.96 : 0.91;
  const PITCH = P ? 0.245 : 0.17;

  const BASE4 = P ? 0.64 : 0.15;
  const BASE1 = P ? -2.20 : -1.79;

  const sx = k => SCX + (k - 1.5) * SSP;

  const slot = (k, j, base) => [
    sx(k),
    base + (j + 0.5) * PITCH,
    0
  ];

  function errorBlock(p, color) {
    const r = new M.Rectangle({
      width: SBW,
      height: PITCH * 0.80,
      color,
      strokeWidth: 1
    });

    r.setFill(color, 0.85);
    r.moveTo(p);

    return r;
  }

  function makeStacks(values, base, color) {
    return values.map((n, k) =>
      Array.from(
        { length: n },
        (_, j) => errorBlock(
          slot(k, j, base),
          color
        )
      )
    );
  }

  function makeNumbers(values, base, color) {
    return values.map((v, k) =>
      txt(
        v,
        P ? 22 : 20,
        color,
        [
          sx(k),
          base + v * PITCH + 0.21,
          0
        ],
        true
      )
    );
  }

  function makeWeekLabels(base) {
    return TARGETS.map((w, k) =>
      txt(
        `WEEK ${w}`,
        P ? 15 : 15,
        C.muted,
        [sx(k), base - 0.25, 0],
        true,
        SSP - 0.12
      )
    );
  }

  function stackFloor(base) {
    return line(
      [sx(0) - SSP / 2, base, 0],
      [sx(3) + SSP / 2, base, 0],
      C.muted,
      2
    );
  }

  function levelLine(base, value, color) {
    const yy = base + value * PITCH;

    return dashed(
      [sx(0) - SSP / 2, yy, 0],
      [sx(3) + SSP / 2, yy, 0],
      color
    );
  }

  const stacks4 = makeStacks(
    FOUR.misses,
    BASE4,
    LONG
  );

  let numbers4 = makeNumbers(
    FOUR.misses,
    BASE4,
    LONG
  );

  const labels4 = makeWeekLabels(BASE4);
  const floor4 = stackFloor(BASE4);

  const title4 = txt(
    '4 WEEKS AHEAD',
    P ? 22 : 20,
    LONG,
    [SCX, P ? 2.77 : 1.54, 0],
    true
  );

  const key = txt(
    '1 block = 1 case missed',
    P ? 17 : 16,
    C.muted,
    [SCX, P ? -0.28 : -0.39, 0]
  );

  await until(S(23));
  await play(
    ...fadeOut([
      ...chartParts,
      ...actualDots,
      fourArrow,
      fourOrigin,
      target,
      f4,
      copy4,
      gap4,
      ...missedWeeks
    ]),
    ...clearBox(),
    new M.FadeIn(title4),
    new M.Create(floor4),
    new M.FadeIn(key),
    ...fadeIn(labels4),
    ...fadeIn(numbers4),
    new M.LaggedStart(
      stacks4.flat().map(b => new M.FadeIn(b)),
      { lagRatio: 0.05, runTime: 1.6 }
    ),
    ...say('FOUR-WEEK MISSES: 5, 3, 2, 6', LONG)
  );

  await until(S(24));
  await play(
    ...fbox([
      ['4 weeks ahead', LONG],
      '5 + 3 + 2 + 6',
      ['= 16 cases', LONG]
    ], LONG),
    ...say('TOTAL MISS = 16 CASES', LONG)
  );

  // Share the sixteen blocks across four forecasts.
  // Move one block from stack 0 to stack 1,
  // and two blocks from stack 3 to stack 2.
  // All four stacks finish at four blocks.

  const moves4 = [];

  function transferBlock(
    stacks, from, to, base, color,
    animations
  ) {
    const b = stacks[from].pop();

    const destination = slot(
      to,
      stacks[to].length,
      base
    );

    stacks[to].push(b);

    animations.push(
      new M.Transform(
        b,
        errorBlock(destination, color),
        { pathArc: -0.65 }
      )
    );
  }

  transferBlock(
    stacks4, 0, 1,
    BASE4, LONG, moves4
  );

  transferBlock(
    stacks4, 3, 2,
    BASE4, LONG, moves4
  );

  transferBlock(
    stacks4, 3, 2,
    BASE4, LONG, moves4
  );

  const balanced4 = makeNumbers(
    [4, 4, 4, 4],
    BASE4,
    LONG
  );

  const level4 = levelLine(
    BASE4, 4, LONG
  );

  await until(S(25));
  await play(
    ...fadeOut(numbers4),
    new M.LaggedStart(
      moves4,
      { lagRatio: 0.25, runTime: 1.5 }
    ),
    ...fbox([
      ['4 weeks ahead', LONG],
      'total miss = 16',
      'forecasts  = 4',
      ['16 ÷ 4 = 4 cases', LONG]
    ], LONG),
    ...say('FOUR-WEEK AVERAGE MISS = 4', LONG)
  );

  await play(
    ...fadeIn(balanced4),
    new M.Create(level4)
  );

  numbers4 = balanced4;

  // ------------------------------------------------------------
  // 26–28: The one-week misses, on exactly the same target weeks.
  // ------------------------------------------------------------

  const stacks1 = makeStacks(
    ONE.misses,
    BASE1,
    SHORT
  );

  let numbers1 = makeNumbers(
    ONE.misses,
    BASE1,
    SHORT
  );

  const labels1 = makeWeekLabels(BASE1);
  const floor1 = stackFloor(BASE1);

  const title1 = txt(
    '1 WEEK AHEAD',
    P ? 22 : 20,
    SHORT,
    [SCX, P ? -0.85 : -0.72, 0],
    true
  );

  const fourMeanTag = pill(
    'AVERAGE = 4',
    LONG,
    P ? 17 : 16
  );

  fourMeanTag.moveTo(P
    ? [SCX, -0.02, 0]
    : [sx(3) + SSP / 2 + 0.95, BASE4 + 4 * PITCH, 0]);

  await until(S(26));
  await play(
    new M.FadeOut(key),
    new M.FadeIn(fourMeanTag),
    new M.FadeIn(title1),
    new M.Create(floor1),
    ...fadeIn(labels1),
    ...fadeIn(numbers1),
    new M.LaggedStart(
      stacks1.flat().map(b => new M.FadeIn(b)),
      { lagRatio: 0.08, runTime: 1.3 }
    ),
    ...fbox([
      ['same target weeks', C.green],
      '9, 10, 11, 12',
      ['1 week: 3, 1, 2, 2', SHORT]
    ], SHORT),
    ...say('ONE-WEEK MISSES: 3, 1, 2, 2', SHORT)
  );

  await until(S(27));
  await play(
    ...fbox([
      ['1 week ahead', SHORT],
      '3 + 1 + 2 + 2',
      ['= 8 cases', SHORT]
    ], SHORT),
    ...say('TOTAL MISS = 8 CASES', SHORT)
  );

  const moves1 = [];

  transferBlock(
    stacks1, 0, 1,
    BASE1, SHORT, moves1
  );

  const balanced1 = makeNumbers(
    [2, 2, 2, 2],
    BASE1,
    SHORT
  );

  const level1 = levelLine(
    BASE1, 2, SHORT
  );

  await until(S(28));
  await play(
    ...fadeOut(numbers1),
    ...moves1,
    ...fbox([
      ['1 week ahead', SHORT],
      'total miss = 8',
      'forecasts  = 4',
      ['8 ÷ 4 = 2 cases', SHORT]
    ], SHORT),
    ...say('ONE-WEEK AVERAGE MISS = 2', SHORT)
  );

  await play(
    ...fadeIn(balanced1),
    new M.Create(level1)
  );

  numbers1 = balanced1;

  // ------------------------------------------------------------
  // 29–30: Replace the stacks with two directly comparable bars.
  // The four-week bar is exactly twice as tall.
  // ------------------------------------------------------------

  const BCX = P ? 0 : -2.55;
  const BSP = P ? 2.55 : 2.9;
  const BBW = P ? 1.48 : 1.65;
  const BBASE = P ? -2.15 : -1.85;
  const BUNIT = P ? 0.95 : 0.68;

  const bx1 = BCX - BSP / 2;
  const bx4 = BCX + BSP / 2;

  function meanBar(value, xx, color) {
    const height = value * BUNIT;

    const r = new M.Rectangle({
      width: BBW,
      height,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0.65);

    r.moveTo([
      xx,
      BBASE + height / 2,
      0
    ]);

    return r;
  }

  function meanNumber(value, xx, color) {
    return txt(
      value,
      P ? 31 : 28,
      color,
      [
        xx,
        BBASE + value * BUNIT + 0.30,
        0
      ],
      true
    );
  }

  function meanLabel(s, xx, color) {
    return txt(
      s,
      P ? 20 : 19,
      color,
      [xx, BBASE - 0.36, 0],
      true,
      BSP - 0.2
    );
  }

  const bar1 = meanBar(2, bx1, SHORT);
  const bar4 = meanBar(4, bx4, LONG);

  const barNumber1 = meanNumber(2, bx1, SHORT);
  const barNumber4 = meanNumber(4, bx4, LONG);

  const barLabel1 = meanLabel(
    '1 WEEK',
    bx1,
    SHORT
  );

  const barLabel4 = meanLabel(
    '4 WEEKS',
    bx4,
    LONG
  );

  const barFloor = line(
    [
      BCX - BSP / 2 - BBW / 2 - 0.38,
      BBASE,
      0
    ],
    [
      BCX + BSP / 2 + BBW / 2 + 0.38,
      BBASE,
      0
    ],
    C.muted,
    2
  );

  const barTitle = txt(
    'AVERAGE MISS (CASES)',
    P ? 23 : 20,
    C.ink,
    [BCX, P ? 2.70 : 1.48, 0],
    true
  );

  const sameWeeks = txt(
    'Same target weeks: 9–12',
    P ? 18 : 17,
    C.muted,
    [BCX, BBASE - 0.80, 0]
  );

  const barGrid = [];

  for (let v = 1; v <= 4; v++) {
    const yy = BBASE + v * BUNIT;

    const guide = line(
      [
        BCX - BSP / 2 - BBW / 2 - 0.25,
        yy,
        0
      ],
      [
        BCX + BSP / 2 + BBW / 2 + 0.25,
        yy,
        0
      ],
      C.muted,
      0.8
    );

    const lab = txt(
      v,
      P ? 15 : 16,
      C.muted,
      [
        BCX - BSP / 2 - BBW / 2 - 0.49,
        yy,
        0
      ],
      true
    );

    barGrid.push(guide, lab);
  }

  await until(S(29));
  await play(
    ...fadeOut([
      ...stacks4.flat(),
      ...stacks1.flat(),
      ...numbers4,
      ...numbers1,
      ...labels4,
      ...labels1,
      floor4,
      floor1,
      title4,
      title1,
      level4,
      level1,
      fourMeanTag
    ]),
    ...clearBox(),
    ...fadeIn(barGrid),
    new M.Create(barFloor),
    new M.FadeIn(barTitle),
    new M.FadeIn(sameWeeks),
    new M.FadeIn(bar1),
    new M.FadeIn(bar4),
    new M.FadeIn(barNumber1),
    new M.FadeIn(barNumber4),
    new M.FadeIn(barLabel1),
    new M.FadeIn(barLabel4),
    ...say('COMPARE 2 CASES WITH 4 CASES')
  );

  const halfGuide = dashed(
    [
      bx1 + BBW / 2,
      BBASE + 2 * BUNIT,
      0
    ],
    [
      bx4 + BBW / 2,
      BBASE + 2 * BUNIT,
      0
    ],
    C.amber
  );

  const doubleTag = pill(
    '2× AS LARGE',
    LONG,
    P ? 19 : 18
  );

  doubleTag.moveTo([
    BCX,
    P ? -3.42 : 0.70,
    0
  ]);

  // On laptop, keep the ratio in the formula area.
  if (!P) {
    doubleTag.moveTo([4.15, 0.97, 0]);
  }

  await until(S(30));
  await play(
    new M.Create(halfGuide),
    new M.FadeIn(doubleTag),
    ...fbox([
      ['4-week error = 4', LONG],
      ['1-week error = 2', SHORT],
      ['4 ÷ 2 = 2', C.green]
    ], C.green),
    ...say('FOUR-WEEK ERROR IS TWICE AS LARGE', LONG)
  );

  // ------------------------------------------------------------
  // 31–33: Define horizon-specific error and its use.
  // ------------------------------------------------------------

  const specificTitle = txt(
    'HORIZON-SPECIFIC ERROR',
    P ? 23 : 20,
    C.green,
    [BCX, P ? 2.70 : 1.48, 0],
    true
  );

  await until(S(31));
  await play(
    new M.Transform(barTitle, specificTitle),
    new M.FadeOut(doubleTag),
    new M.FadeOut(halfGuide),
    ...fbox([
      ['one score per horizon', C.green],
      ['1 week  = 2 cases', SHORT],
      ['4 weeks = 4 cases', LONG]
    ], C.green),
    ...say('HORIZON-SPECIFIC ERROR', C.green)
  );

  await until(S(32));
  await play(
    ...fbox([
      ['for each horizon:', C.green],
      'sum of miss sizes',
      '÷ number of forecasts',
      ['8 ÷ 4  = 2', SHORT],
      ['16 ÷ 4 = 4', LONG]
    ], C.green),
    ...say('ADD AND DIVIDE WITHIN EACH HORIZON', C.green)
  );

  const supplierTag1 = pill(
    'SUPPLIER A',
    SHORT,
    P ? 16 : 17
  );

  supplierTag1.moveTo([
    bx1,
    BBASE - 0.85,
    0
  ]);

  const supplierTag4 = pill(
    'SUPPLIER B',
    LONG,
    P ? 16 : 17
  );

  supplierTag4.moveTo([
    bx4,
    BBASE - 0.85,
    0
  ]);

  await until(S(33));
  await play(
    new M.FadeOut(sameWeeks),
    new M.FadeIn(supplierTag1),
    new M.FadeIn(supplierTag4),
    ...fbox([
      ['supplier A', SHORT],
      '1 week: 2 cases',
      ['supplier B', LONG],
      '4 weeks: 4 cases'
    ], C.green),
    ...say('USE THE SCORE FOR YOUR ORDERING DISTANCE')
  );

  // ------------------------------------------------------------
  // 34–35: Trap — mixing both horizons in a single score.
  // The pooled average would be 3 cases, hiding the distinction.
  // ------------------------------------------------------------

  const mixedColor = C.muted;

  const mixedBar = meanBar(
    3,
    BCX,
    mixedColor
  );

  const mixedNumber = meanNumber(
    3,
    BCX,
    mixedColor
  );

  const mixedLabel = meanLabel(
    'MIXED SCORE',
    BCX,
    mixedColor
  );

  const mixedTitle = txt(
    'BOTH HORIZONS MIXED TOGETHER',
    P ? 20 : 19,
    C.amber,
    [BCX, P ? 2.70 : 1.48, 0],
    true
  );

  await until(S(34));
  await play(
    ...fadeOut([
      supplierTag1,
      supplierTag4,
      bar1,
      bar4,
      barNumber1,
      barNumber4,
      barLabel1,
      barLabel4
    ]),
    new M.FadeIn(mixedBar),
    new M.FadeIn(mixedNumber),
    new M.FadeIn(mixedLabel),
    new M.Transform(barTitle, mixedTitle),
    ...fbox([
      ['mixed horizons', C.amber],
      'total miss = 8 + 16',
      'forecasts  = 4 + 4',
      ['24 ÷ 8 = 3 cases', C.muted]
    ], C.amber),
    ...say('TRAP: MIXING BOTH DISTANCES', C.amber)
  );

  // Draw the separate results as outlines around the pooled
  // score to expose the difference that was hidden.

  function barOutline(value, xx, color) {
    const r = new M.Rectangle({
      width: BBW,
      height: value * BUNIT,
      color,
      strokeWidth: 2.5
    });

    r.setFill(color, 0);

    r.moveTo([
      xx,
      BBASE + value * BUNIT / 2,
      0
    ]);

    return r;
  }

  const hidden1 = barOutline(
    2, bx1, SHORT
  );

  const hidden4 = barOutline(
    4, bx4, LONG
  );

  const hiddenNumber1 = meanNumber(
    2, bx1, SHORT
  );

  const hiddenNumber4 = meanNumber(
    4, bx4, LONG
  );

  const hiddenLabel1 = meanLabel(
    '1 WEEK',
    bx1,
    SHORT
  );

  const hiddenLabel4 = meanLabel(
    '4 WEEKS',
    bx4,
    LONG
  );

  await until(S(35));
  await play(
    new M.Create(hidden1),
    new M.Create(hidden4),
    new M.FadeIn(hiddenNumber1),
    new M.FadeIn(hiddenNumber4),
    new M.FadeIn(hiddenLabel1),
    new M.FadeIn(hiddenLabel4),
    ...fbox([
      ['the mixed score hides:', C.amber],
      ['1 week  = 2 cases', SHORT],
      ['4 weeks = 4 cases', LONG],
      'different ordering risks'
    ], C.amber),
    ...say('ONE MIXED SCORE HIDES THE DIFFERENCE', C.amber)
  );

  // ------------------------------------------------------------
  // 36: Recap.
  // Same model, same target weeks, separate horizons.
  // ------------------------------------------------------------

  const finalTitle = txt(
    'HORIZON-SPECIFIC ERROR',
    P ? 23 : 20,
    C.green,
    [BCX, P ? 2.70 : 1.48, 0],
    true
  );

  const finalBar1 = meanBar(
    2, bx1, SHORT
  );

  const finalBar4 = meanBar(
    4, bx4, LONG
  );

  const finalTag = pill(
    'SAME WEEKS · SEPARATE SCORES',
    C.green,
    P ? 18 : 18
  );

  finalTag.moveTo(
    P
      ? [0, BBASE - 0.85, 0]
      : [4.15, 1.13, 0]
  );

  await until(S(36));
  await play(
    ...fadeOut([
      mixedBar,
      mixedNumber,
      mixedLabel,
      hidden1,
      hidden4
    ]),
    new M.Transform(barTitle, finalTitle),
    new M.FadeIn(finalBar1),
    new M.FadeIn(finalBar4),
    new M.FadeIn(finalTag),
    ...fbox([
      ['same naive rule', C.cyan],
      'same weeks: 9–12',
      ['1 week:  8 ÷ 4 = 2', SHORT],
      ['4 weeks: 16 ÷ 4 = 4', LONG],
      ['score each horizon', C.green]
    ], C.green),
    ...say('SAME TARGET WEEKS, ONE SCORE PER HORIZON', C.green)
  );

  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          hiddenNumber1,
          { color: SHORT }
        ),
        new M.Indicate(
          hiddenNumber4,
          { color: LONG }
        )
      ],
      {
        lagRatio: 0.45,
        runTime: Math.min(
          2.4,
          Math.max(
            1.0,
            E(36) - S(36) - 1.5
          )
        )
      }
    )
  );
}
