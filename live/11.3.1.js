// lesson 11.3.1
// Rolling-origin validation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback has not been runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  const D = [40, 41, 44, 42, 44, 45, 48, 46, 49, 48, 50, 52];
  const TARGETS = [9, 10, 11, 12];
  const FORECASTS = [46, 49, 48, 50];
  const ACTUALS = [49, 48, 50, 52];
  const ERRORS = [3, 1, 2, 2];

  // Responsive layout: phone 8 × 14.22; laptop 14.22 × 8.
  const PILL = P ? [0, 3.65, 0] : [0, 1.95, 0];
  const CX = P ? 0.18 : 0.2;
  const SP = (FW - (P ? 1.85 : 3.0)) / 11;
  const BASE = P ? -3.2 : -1.55;
  const UNIT = P ? 0.4 : 0.20;
  const TOP = BASE + 12 * UNIT + 0.53;
  const BOTTOM = BASE - 0.34;

  const x = w => CX + (w - 6.5) * SP;
  const y = v => BASE + (v - 40) * UNIT;
  const pt = (w, v) => [x(w), y(v), 0];

  const LEFT = x(1) - SP / 2;
  const RIGHT = x(12) + SP / 2;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const txt = (s, size, color, p, mono = false, maxw = FW - 1) => {
    const t = T(String(s), size, color, mono);
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    t.moveTo(p);
    return t;
  };

  const fadeIn = objects => objects.map(o => new M.FadeIn(o));
  const fadeOut = objects => objects.filter(Boolean).map(o => new M.FadeOut(o));

  function rect(w, h, p, color, fill = 0, strokeWidth = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.08,
      color,
      strokeWidth
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

  function dashed(a, b, color = C.muted) {
    return new M.DashedLine({
      start: a,
      end: b,
      color
    });
  }

  function arrow(a, b, color = C.amber) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / d;
    const uy = dy / d;
    const h = 0.17;
    const wing = 0.09;

    return new M.VGroup(
      line(a, b, color, 3),
      line(b, [
        b[0] - h * ux + wing * uy,
        b[1] - h * uy - wing * ux,
        0
      ], color, 3),
      line(b, [
        b[0] - h * ux - wing * uy,
        b[1] - h * uy + wing * ux,
        0
      ], color, 3)
    );
  }

  // Formula box, following the approved lesson's style.
  let boxNow = null;

  const BOXP = P ? [0, -4.15, 0] : [4.25, -0.35, 0];

  function fbox(lines, color = C.cyan, position = BOXP) {
    const size = P ? 22 : 21;
    const lh = P ? 0.43 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
    const top = position[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.6;

    if (wd > maxw) g.scale(maxw / wd);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

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
  // 0–2: Ordering bottled water for North.
  // ------------------------------------------------------------

  function waterCase(cx, cy) {
    const parts = [];

    const crate = rect(
      1.48, 0.62,
      [cx, cy - 0.29, 0],
      C.cyan, 0.18
    );

    for (let k = 0; k < 3; k++) {
      const bx = cx + (k - 1) * 0.42;

      const body = rect(
        0.31, 0.84,
        [bx, cy + 0.17, 0],
        C.cyan, 0.30
      );

      const neck = rect(
        0.14, 0.21,
        [bx, cy + 0.65, 0],
        C.cyan, 0.45
      );

      const cap = rect(
        0.20, 0.10,
        [bx, cy + 0.80, 0],
        C.ink, 0.9, 1
      );

      const band = rect(
        0.29, 0.20,
        [bx, cy + 0.18, 0],
        C.cyan, 0.85, 1
      );

      parts.push(body, neck, cap, band);
    }

    parts.push(crate);

    return new M.VGroup(...parts);
  }

  const introY = P ? -0.25 : -0.2;

  const cases = [-1.75, 0, 1.75].map(
    cx => waterCase(cx, introY)
  );

  const north = pill('NORTH', C.cyan, P ? 23 : 22);
  north.moveTo([0, introY + 1.45, 0]);

  const order = pill('NEXT WEEK: ? CASES', C.amber, 22);
  order.moveTo([0, introY - 1.15, 0]);

  await until(S(0));
  await play(
    new M.LaggedStart(
      cases.map(c => new M.FadeIn(c)),
      { lagRatio: 0.18, runTime: 1.2 }
    ),
    new M.FadeIn(north),
    ...say('ORDERING BOTTLED WATER')
  );

  await until(S(1));
  await play(
    new M.FadeIn(order),
    ...say('HOW MANY CASES NEXT WEEK?', C.amber)
  );

  await until(S(2));
  await play(
    new M.Indicate(order, { color: C.amber }),
    ...say('WOULD OUR GUESS HAVE WORKED BEFORE?', C.amber)
  );

  // ------------------------------------------------------------
  // 3–4: Twelve weekly slots and North's actual demand.
  // ------------------------------------------------------------

  const chartParts = [];
  const actualDots = [];
  const forecastDots = [];
  const gapMarks = [];
  const copyLines = [];

  const chartTitle = txt(
    'NORTH: CASES WANTED',
    P ? 21 : 20,
    C.cyan,
    [0, P ? 2.55 : 1.43, 0],
    true
  );

  chartParts.push(chartTitle);

  const baseline = line(
    [LEFT, BOTTOM, 0],
    [RIGHT, BOTTOM, 0],
    C.muted,
    2
  );

  chartParts.push(baseline);

  // Vertical week slots.
  for (let w = 1; w <= 12; w++) {
    const slotLine = line(
      [x(w), BOTTOM, 0],
      [x(w), TOP, 0],
      C.muted,
      0.65
    );

    const tick = line(
      [x(w), BOTTOM - 0.05, 0],
      [x(w), BOTTOM + 0.05, 0],
      C.muted,
      2
    );

    const label = txt(
      w,
      P ? 15 : 17,
      C.muted,
      [x(w), BOTTOM - 0.23, 0],
      true,
      SP * 0.82
    );

    chartParts.push(slotLine, tick, label);
  }

  // Horizontal guides: cases of water.
  for (const v of [40, 44, 48, 52]) {
    const guide = line(
      [LEFT, y(v), 0],
      [RIGHT, y(v), 0],
      C.muted,
      0.7
    );

    const label = txt(
      v,
      P ? 15 : 16,
      C.muted,
      [LEFT - (P ? 0.26 : 0.34), y(v), 0],
      true
    );

    chartParts.push(guide, label);
  }

  const weeksLabel = txt(
    'week',
    16,
    C.muted,
    [CX, BOTTOM - 0.58, 0]
  );

  chartParts.push(weeksLabel);

  function actual(w, v, labelBelow = false) {
    const p = pt(w, v);

    const halo = new M.Dot({
      point: p,
      radius: P ? 0.15 : 0.17,
      color: C.cyan
    });

    halo.setFill(C.cyan, 0.17);

    const d = new M.Dot({
      point: p,
      radius: P ? 0.066 : 0.075,
      color: C.cyan
    });

    const label = txt(
      v,
      P ? 15 : 16,
      C.cyan,
      [p[0], p[1] + (labelBelow ? -0.24 : 0.24), 0],
      true,
      SP * 0.85
    );

    return new M.VGroup(halo, d, label);
  }

  function forecast(w, v) {
    const ring = new M.Circle({
      radius: P ? 0.087 : 0.092,
      color: C.amber,
      strokeWidth: 3
    });

    ring.setFill(C.amber, 0);
    ring.moveTo(pt(w, v));

    return ring;
  }

  function gap(w, predicted, observed) {
    return line(
      pt(w, predicted),
      pt(w, observed),
      C.violet,
      3
    );
  }

  function copyGuide(origin, target, value) {
    const inset = P ? 0.11 : 0.14;

    return dashed(
      [x(origin) + inset, y(value), 0],
      [x(target) - inset, y(value), 0],
      C.amber
    );
  }

  for (let w = 1; w <= 12; w++) {
    actualDots.push(actual(w, D[w - 1]));
  }

  await until(S(3));
  await play(
    ...fadeOut([...cases, north, order]),
    new M.LaggedStart(
      chartParts.map(o => new M.FadeIn(o)),
      { lagRatio: 0.015, runTime: 1.3 }
    ),
    ...say('12 WEEKS AT NORTH')
  );

  await until(S(4));
  await play(
    new M.LaggedStart(
      actualDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.08, runTime: 1.7 }
    ),
    ...say('FILLED DOT = ACTUAL DEMAND')
  );

  // ------------------------------------------------------------
  // 5–7: Cover the future and stand at the end of week eight.
  // ------------------------------------------------------------

  function coverAfter(w) {
    const left = x(w) + SP / 2;
    const width = RIGHT - left;

    const r = new M.RoundedRectangle({
      width,
      height: TOP - BOTTOM,
      cornerRadius: 0.09,
      color: C.muted,
      strokeWidth: 2
    });

    r.setFill(C.card, 1);
    r.moveTo([
      (left + RIGHT) / 2,
      (TOP + BOTTOM) / 2,
      0
    ]);

    return r;
  }

  function cutoffAfter(w) {
    const xx = x(w) + SP / 2;

    return dashed(
      [xx, BOTTOM - 0.02, 0],
      [xx, TOP + 0.08, 0],
      C.green
    );
  }

  function originTag(w) {
    const t = pill(
      `ORIGIN: ${w}`,
      C.green,
      P ? 15 : 17
    );

    const half = t.getWidth() / 2;

    const xx = Math.max(
      -FW / 2 + half + 0.35,
      Math.min(x(w), FW / 2 - half - 0.35)
    );

    t.moveTo([xx, BOTTOM - 0.96, 0]);

    return t;
  }

  let cover = coverAfter(8);
  let cutoff = cutoffAfter(8);
  let origin = null;

  // one "?" per hidden week
  const marksAfter = w => {
    const out = [];
    for (let k = w + 1; k <= 12; k++) {
      out.push(txt('?', P ? 24 : 26, C.muted, [x(k), TOP - 0.3, 0], true));
    }
    return out;
  };
  let hiddenTag = marksAfter(8);

  // swap the card for a narrower one (fade, so the fill keeps its dark colour)
  function moveCover(w) {
    const a = [new M.FadeOut(cover), ...fadeOut(hiddenTag)];
    if (w < 12) {
      cover = coverAfter(w);
      hiddenTag = marksAfter(w);
      a.push(new M.FadeIn(cover), ...fadeIn(hiddenTag));
    } else {
      cover = null;
      hiddenTag = [];
    }
    return a;
  }

  await until(S(5));
  await play(
    ...fadeOut(actualDots.slice(8)),
    new M.FadeIn(cover),
    ...fadeIn(hiddenTag),
    ...say('COVER WEEKS 9–12', C.violet)
  );

  const knownTag = pill(
    'KNOWN SO FAR',
    C.cyan,
    P ? 15 : 17
  );

  knownTag.moveTo([
    (x(1) + x(8)) / 2,
    P ? BOTTOM - 0.96 : -3.0,
    0
  ]);

  await until(S(6));
  await play(
    new M.Create(cutoff),
    new M.FadeIn(knownTag),
    ...say('ONLY WEEKS 1–8 ARE KNOWN')
  );

  await until(S(7));
  await play(
    new M.Indicate(actualDots[7], { color: C.amber }),
    ...say('WEEK 8: 46 CASES', C.amber)
  );

  // ------------------------------------------------------------
  // 8–11: Make the first forecast before seeing the truth.
  // ------------------------------------------------------------

  forecastDots[0] = forecast(9, 46);
  copyLines[0] = copyGuide(8, 9, 46);

  await until(S(8));
  await play(
    new M.Create(copyLines[0]),
    new M.FadeIn(forecastDots[0]),
    ...say('COPY 46 INTO WEEK 9', C.amber)
  );

  await until(S(9));
  await play(
    new M.Indicate(forecastDots[0], { color: C.amber }),
    ...say('HOLLOW DOT = FORECAST', C.amber)
  );

  const RULEP = P ? [0, -5.4, 0] : [0, -3.1, 0];

  await until(S(10));
  await play(
    new M.FadeOut(knownTag),
    ...fbox(
      [['next week = last known count', C.amber]],
      C.amber,
      RULEP
    ),
    ...say('THE NAIVE FORECAST', C.amber)
  );

  origin = originTag(8);

  // On laptop, use the empty area under the left of the chart.
  if (!P) origin.moveTo([-4.6, -2.56, 0]);

  await until(S(11));
  await play(
    ...clearBox(),
    new M.FadeIn(origin),
    new M.Indicate(actualDots[7], { color: C.green }),
    ...say('FORECAST ORIGIN = LAST KNOWN WEEK', C.green)
  );

  // ------------------------------------------------------------
  // 12–14: Reveal week nine and measure its miss.
  // ------------------------------------------------------------

  actualDots[8] = actual(9, 49);

  await until(S(12));
  await play(
    ...moveCover(9),
    new M.FadeOut(copyLines[0]),
    new M.FadeIn(actualDots[8]),
    ...say('REVEAL WEEK 9', C.cyan)
  );

  await until(S(13));
  await play(
    new M.Indicate(actualDots[8], { color: C.cyan }),
    ...say('ACTUAL: 49 CASES')
  );

  gapMarks[0] = gap(9, 46, 49);

  await until(S(14));
  await play(
    new M.Create(gapMarks[0]),
    ...say('49 − 46 = 3 CASES', C.violet)
  );

  // ------------------------------------------------------------
  // 15–18: Roll forward and test week ten.
  // ------------------------------------------------------------

  function moveOrigin(w) {
    const nextTag = originTag(w);

    if (!P) nextTag.moveTo([-4.6, -2.56, 0]);

    const nextCut = cutoffAfter(w);
    const a = [
      new M.FadeOut(cutoff),
      new M.FadeOut(origin),
      new M.FadeIn(nextCut),
      new M.FadeIn(nextTag)
    ];
    cutoff = nextCut;
    origin = nextTag;

    return a;
  }

  await until(S(15));
  await play(
    ...moveOrigin(9),
    ...say('MOVE THE CUTOFF TO WEEK 9', C.green)
  );

  forecastDots[1] = forecast(10, 49);
  copyLines[1] = copyGuide(9, 10, 49);

  await until(S(16));
  await play(
    new M.Create(copyLines[1]),
    new M.FadeIn(forecastDots[1]),
    ...say('WEEK 10 FORECAST: 49', C.amber)
  );

  // Put this actual label below its dot so the higher hollow
  // forecast remains easy to distinguish.
  actualDots[9] = actual(10, 48, true);

  await until(S(17));
  await play(
    ...moveCover(10),
    new M.FadeOut(copyLines[1]),
    new M.FadeIn(actualDots[9]),
    ...say('WEEK 10 ACTUAL: 48')
  );

  gapMarks[1] = gap(10, 49, 48);

  await until(S(18));
  await play(
    new M.Create(gapMarks[1]),
    ...say('1 CASE TOO HIGH', C.violet)
  );

  // ------------------------------------------------------------
  // 19–21: Roll forward and test week eleven.
  // ------------------------------------------------------------

  forecastDots[2] = forecast(11, 48);
  copyLines[2] = copyGuide(10, 11, 48);

  await until(S(19));
  await play(
    ...moveOrigin(10),
    new M.Create(copyLines[2]),
    new M.FadeIn(forecastDots[2]),
    ...say('WEEK 11 FORECAST: 48', C.amber)
  );

  actualDots[10] = actual(11, 50);

  await until(S(20));
  await play(
    ...moveCover(11),
    new M.FadeOut(copyLines[2]),
    new M.FadeIn(actualDots[10]),
    ...say('WEEK 11 ACTUAL: 50')
  );

  gapMarks[2] = gap(11, 48, 50);

  await until(S(21));
  await play(
    new M.Create(gapMarks[2]),
    ...say('50 − 48 = 2 CASES', C.violet)
  );

  // ------------------------------------------------------------
  // 22–24: Roll forward and test week twelve.
  // ------------------------------------------------------------

  forecastDots[3] = forecast(12, 50);
  copyLines[3] = copyGuide(11, 12, 50);

  await until(S(22));
  await play(
    ...moveOrigin(11),
    new M.Create(copyLines[3]),
    new M.FadeIn(forecastDots[3]),
    ...say('WEEK 12 FORECAST: 50', C.amber)
  );

  actualDots[11] = actual(12, 52);

  await until(S(23));
  await play(
    ...moveCover(12),
    new M.FadeOut(copyLines[3]),
    new M.FadeIn(actualDots[11]),
    ...say('WEEK 12 ACTUAL: 52')
  );

  gapMarks[3] = gap(12, 50, 52);

  await until(S(24));
  await play(
    new M.Create(gapMarks[3]),
    ...say('52 − 50 = 2 CASES', C.violet)
  );

  // ------------------------------------------------------------
  // 25–27: Convert the four vertical gaps into unsigned stacks.
  // Each block represents one case missed.
  // ------------------------------------------------------------

  const SCX = P ? 0 : -2.7;
  const SSP = P ? 1.43 : 1.45;
  const SBW = P ? 0.94 : 0.91;
  const PITCH = P ? 0.72 : 0.57;
  const SBASE = P ? -2.20 : -1.77;

  const sx = k => SCX + (k - 1.5) * SSP;

  const slot = (k, j) => [
    sx(k),
    SBASE + (j + 0.5) * PITCH,
    0
  ];

  function errorBlock(p, color = C.violet) {
    const r = new M.Rectangle({
      width: SBW,
      height: PITCH * 0.83,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.83);
    r.moveTo(p);

    return r;
  }

  const stacks = ERRORS.map((n, k) =>
    Array.from(
      { length: n },
      (_, j) => errorBlock(slot(k, j))
    )
  );

  const scoreFloor = line(
    [sx(0) - SSP / 2, SBASE, 0],
    [sx(3) + SSP / 2, SBASE, 0],
    C.muted,
    2
  );

  const targetLabels = TARGETS.map((w, k) =>
    txt(
      `WEEK ${w}`,
      P ? 15 : 16,
      C.muted,
      [sx(k), SBASE - 0.35, 0],
      true,
      SSP - 0.12
    )
  );

  const scoreTitle = txt(
    'SIZE OF EACH MISS',
    P ? 22 : 20,
    C.violet,
    [SCX, P ? 1.65 : 1.08, 0],
    true
  );

  let errorLabels = ERRORS.map((n, k) =>
    txt(
      n,
      25,
      C.violet,
      [sx(k), SBASE + n * PITCH + 0.27, 0],
      true
    )
  );

  const blockKey = txt(
    '1 block = 1 case missed',
    17,
    C.muted,
    [SCX, SBASE - 0.83, 0]
  );

  await until(S(25));
  await play(
    ...fadeOut([
      ...chartParts,
      ...actualDots,
      ...forecastDots,
      ...gapMarks,
      cutoff,
      origin
    ]),
    new M.Create(scoreFloor),
    new M.FadeIn(scoreTitle),
    new M.FadeIn(blockKey),
    ...fadeIn(targetLabels),
    ...fadeIn(errorLabels),
    new M.LaggedStart(
      stacks.flat().map(b => new M.FadeIn(b)),
      { lagRatio: 0.10, runTime: 1.2 }
    ),
    ...say('FOUR MISSES: 3, 1, 2, 2', C.violet)
  );

  const directions = [
    'TOO LOW',
    'TOO HIGH',
    'TOO LOW',
    'TOO LOW'
  ].map((s, k) =>
    txt(
      s,
      P ? 15 : 15,
      k === 1 ? C.amber : C.muted,
      [sx(k), SBASE - 0.61, 0],
      true,
      SSP - 0.10
    )
  );

  await until(S(26));
  await play(
    new M.FadeOut(blockKey),
    ...fadeIn(directions),
    new M.Indicate(stacks[1][0], { color: C.amber }),
    ...say('COUNT THE SIZE, NOT THE DIRECTION', C.amber)
  );

  await until(S(27));
  await play(
    ...fadeOut(directions),
    new M.FadeIn(blockKey),
    new M.LaggedStart(
      errorLabels.map(t =>
        new M.Indicate(t, { color: C.violet })
      ),
      { lagRatio: 0.12, runTime: 1.1 }
    ),
    ...say('ABSOLUTE = SIZE OF THE GAP', C.violet)
  );

  // ------------------------------------------------------------
  // 28–32: Add the misses and share the total equally.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...fbox([
      'total miss',
      '3 + 1 + 2 + 2',
      ['= 8 cases', C.amber]
    ], C.amber),
    ...say('8 CASES IN TOTAL', C.amber)
  );

  // Transfer one block from the three-block stack
  // to the one-block stack. No case is added or lost.
  const transfer = stacks[0].pop();
  stacks[1].push(transfer);

  await until(S(29));
  await play(
    ...fadeOut(errorLabels),
    new M.Transform(
      transfer,
      errorBlock(slot(1, 1)),
      { pathArc: -0.85 }
    ),
    ...fbox([
      'total miss = 8',
      ['forecasts  = 4', C.green],
      'share equally'
    ], C.green),
    ...say('SHARE 8 CASES ACROSS 4 FORECASTS', C.green)
  );

  errorLabels = TARGETS.map((_, k) =>
    txt(
      '2',
      25,
      C.amber,
      [sx(k), SBASE + 2 * PITCH + 0.27, 0],
      true
    )
  );

  const level = dashed(
    [sx(0) - SSP / 2, SBASE + 2 * PITCH, 0],
    [sx(3) + SSP / 2, SBASE + 2 * PITCH, 0],
    C.amber
  );

  await until(S(30));
  await play(
    new M.Create(level),
    ...fadeIn(errorLabels),
    ...fbox([
      'total miss = 8',
      'forecasts  = 4',
      ['8 ÷ 4 = 2 cases', C.amber]
    ], C.green),
    ...say('AVERAGE MISS = 2 CASES', C.amber)
  );

  const maeTitle = txt(
    'MEAN ABSOLUTE ERROR',
    P ? 22 : 20,
    C.green,
    [SCX, P ? 1.65 : 1.08, 0],
    true
  );

  await until(S(31));
  await play(
    new M.Transform(scoreTitle, maeTitle),
    ...fbox([
      ['mean absolute error', C.green],
      'MAE = 8 ÷ 4',
      ['    = 2 cases', C.amber]
    ], C.green),
    ...say('MEAN ABSOLUTE ERROR = MAE', C.green)
  );

  await until(S(32));
  await play(
    ...fbox([
      ['MAE =', C.green],
      'sum of miss sizes',
      '÷ number of forecasts',
      ['= 2 cases', C.amber]
    ], C.green),
    ...say('ADD THE SIZES, THEN DIVIDE', C.green)
  );

  // ------------------------------------------------------------
  // 33–36: Four forecast origins, rolling forward through time.
  // Cyan = known data. Amber outline = next forecast.
  // Muted slots = still hidden at that origin.
  // ------------------------------------------------------------

  const RSP = P ? 0.47 : 0.69;
  const RSTART = P ? -3.45 : -5.32;
  const RW = RSP * 0.79;
  const RH = P ? 0.6 : 0.43;
  const ROWGAP = P ? 1.3 : 0.78;
  const RY = P ? 1.23 : 0.53;

  const rx = w => RSTART + (w - 1) * RSP;
  const ry = k => RY - k * ROWGAP;

  const RESULTX = P ? 3.1 : 4.35;

  const replayParts = [];
  const replayRows = [];
  const replayCutoffs = [];
  const replayTargets = [];
  const replayResults = [];

  const replayHeading = txt(
    'REPLAY THE FOUR PAST DECISIONS',
    P ? 21 : 21,
    C.ink,
    [0, P ? 2.57 : 1.36, 0],
    true
  );

  replayParts.push(replayHeading);

  for (let w = 1; w <= 12; w++) {
    replayParts.push(
      txt(
        w,
        P ? 15 : 17,
        C.muted,
        [rx(w), RY + 0.48, 0],
        true,
        RSP * 0.94
      )
    );
  }

  const resultHead = txt(
    'MISS',
    P ? 15 : 18,
    C.violet,
    [RESULTX, RY + 0.48, 0],
    true
  );

  replayParts.push(resultHead);

  for (let k = 0; k < 4; k++) {
    const o = 8 + k;
    const t = o + 1;
    const rowParts = [];

    for (let w = 1; w <= 12; w++) {
      const p = [rx(w), ry(k), 0];

      if (w <= o) {
        const r = rect(
          RW, RH, p,
          C.cyan, 0.33, 1.5
        );

        const d = new M.Dot({
          point: p,
          radius: P ? 0.043 : 0.060,
          color: C.cyan
        });

        rowParts.push(r, d);
      } else if (w === t) {
        const r = rect(
          RW, RH, p,
          C.amber, 0.04, 2
        );

        const d = new M.Circle({
          radius: P ? 0.075 : 0.092,
          color: C.amber,
          strokeWidth: 2.5
        });

        d.setFill(C.amber, 0);
        d.moveTo(p);

        rowParts.push(r, d);
        replayTargets.push(d);
      } else {
        const r = rect(
          RW, RH, p,
          C.muted, 0.12, 1
        );

        rowParts.push(r);
      }
    }

    const xx = rx(o) + RSP / 2;

    const boundary = line(
      [xx, ry(k) - RH / 2 - 0.12, 0],
      [xx, ry(k) + RH / 2 + 0.12, 0],
      C.green,
      3
    );

    replayCutoffs.push(boundary);
    rowParts.push(boundary);

    const originLabel = txt(
      `origin ${o}`,
      P ? 15 : 15,
      C.green,
      [
        (rx(1) + rx(o)) / 2,
        ry(k) - RH / 2 - 0.19,
        0
      ],
      true
    );

    rowParts.push(originLabel);

    const result = txt(
      `${ERRORS[k]}`,
      P ? 23 : 24,
      C.violet,
      [RESULTX, ry(k), 0],
      true
    );

    replayResults.push(result);
    rowParts.push(result);

    replayRows.push(new M.VGroup(...rowParts));
  }

  const LEGENDY = P ? -3.85 : -2.6;

  const legendKnown = pill(
    'KNOWN',
    C.cyan,
    P ? 15 : 17
  );

  legendKnown.moveTo([
    P ? -2.25 : -3.9,
    LEGENDY,
    0
  ]);

  const legendForecast = pill(
    'FORECAST',
    C.amber,
    P ? 15 : 17
  );

  legendForecast.moveTo([0, LEGENDY, 0]);

  const legendHidden = pill(
    'HIDDEN',
    C.muted,
    P ? 15 : 17
  );

  legendHidden.moveTo([
    P ? 2.25 : 3.9,
    LEGENDY,
    0
  ]);

  const replayLegend = [
    legendKnown,
    legendForecast,
    legendHidden
  ];

  await until(S(33));
  await play(
    ...fadeOut([
      scoreTitle,
      scoreFloor,
      blockKey,
      level,
      ...targetLabels,
      ...errorLabels,
      ...stacks.flat()
    ]),
    ...clearBox(),
    ...fadeIn(replayParts),
    ...fadeIn(replayLegend),
    new M.LaggedStart(
      replayRows.map(r => new M.FadeIn(r)),
      { lagRatio: 0.35, runTime: 1.8 }
    ),
    ...say('THE CUTOFF ROLLS FORWARD', C.green)
  );

  await until(S(34));
  await play(
    new M.LaggedStart(
      replayCutoffs.map(c =>
        new M.Indicate(c, { color: C.green })
      ),
      { lagRatio: 0.35, runTime: 2.3 }
    ),
    ...say('ROLLING-ORIGIN VALIDATION', C.green)
  );

  await until(S(35));
  await play(
    new M.LaggedStart(
      replayTargets.map(d =>
        new M.Indicate(d, { color: C.amber })
      ),
      { lagRatio: 0.30, runTime: 2.4 }
    ),
    ...say('GUESS FIRST, REVEAL SECOND', C.amber)
  );

  // The same four target weeks must be used when comparing rules.
  const comparisonPosition = P
    ? [0, -5.3, 0]
    : [4.5, 0.1, 0];

  // On laptop the comparison box replaces the miss-number column.
  const comparisonBox = () => fbox([
    ['naive forecast', C.cyan],
    'weeks 9–12',
    ['MAE = 2 cases', C.amber]
  ], C.green, comparisonPosition);

  await until(S(36));
  await play(
    ...(P
      ? comparisonBox()
      : [
          ...replayResults.map(r =>
            new M.Indicate(r, { color: C.violet })
          )
        ]),
    ...say('COMPARE RULES ON THE SAME WEEKS', C.green)
  );

  // ------------------------------------------------------------
  // 37–39: The trap — shuffling allows future information
  // to leak into a forecast for an earlier week.
  // ------------------------------------------------------------

  const trapY = P ? -0.35 : -0.15;
  const trapSP = P ? 1.65 : 2.35;

  const shuffled = [8, 12, 9, 10];

  function weekCard(w, p, target = false) {
    const width = P ? 1.35 : 1.84;
    const height = P ? 1.37 : 1.44;

    const color = target ? C.amber : C.cyan;

    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 1);
    r.moveTo(p);

    const header = txt(
      `WEEK ${w}`,
      P ? 17 : 19,
      C.muted,
      [p[0], p[1] + 0.42, 0],
      true,
      width - 0.16
    );

    const value = txt(
      target ? '?' : D[w - 1],
      P ? 29 : 32,
      color,
      [p[0], p[1] - 0.09, 0],
      true
    );

    const unit = txt(
      target ? 'forecast' : 'cases',
      P ? 15 : 15,
      color,
      [p[0], p[1] - 0.48, 0],
      false,
      width - 0.16
    );

    return new M.VGroup(r, header, value, unit);
  }

  const orderedWeeks = [8, 9, 10, 12];

  const trapCards = orderedWeeks.map((w, k) =>
    weekCard(
      w,
      [(k - 1.5) * trapSP, trapY, 0],
      w === 10
    )
  );

  const trapTitle = txt(
    'WEEKS SHUFFLED OUT OF TIME ORDER',
    P ? 19 : 21,
    C.amber,
    [0, P ? 2.25 : 1.28, 0],
    true
  );

  await until(S(37));
  await play(
    ...fadeOut([
      ...replayParts,
      ...replayRows,
      ...replayLegend
    ]),
    ...clearBox(),
    new M.FadeIn(trapTitle),
    ...fadeIn(trapCards),
    ...say('TRAP: SHUFFLING THE WEEKS', C.amber)
  );

  // Animate the actual permutation, retaining week identity.
  await play(
    ...orderedWeeks.map((w, k) => {
      const j = shuffled.indexOf(w);

      return new M.Transform(
        trapCards[k],
        weekCard(
          w,
          [(j - 1.5) * trapSP, trapY, 0],
          w === 10
        ),
        { pathArc: k % 2 === 0 ? 0.7 : -0.7 }
      );
    })
  );

  const futureX = -0.5 * trapSP;
  const targetX = 1.5 * trapSP;

  const leakArrow = arrow(
    [futureX, trapY + 0.91, 0],
    [targetX, trapY + 0.91, 0],
    C.amber
  );

  const leakLabel = txt(
    'FUTURE INFORMATION',
    P ? 17 : 19,
    C.amber,
    [
      (futureX + targetX) / 2,
      trapY + 1.23,
      0
    ],
    true
  );

  await until(S(38));
  await play(
    new M.FadeIn(leakArrow),
    new M.FadeIn(leakLabel),
    new M.Indicate(trapCards[3], { color: C.amber }),
    ...say('WEEK 12 LEAKS INTO A WEEK 10 GUESS', C.amber)
  );

  const warning = pill(
    'NOT AVAILABLE WHEN ORDERING',
    C.amber,
    P ? 18 : 19
  );

  warning.moveTo([0, trapY - 1.45, 0]);

  const crossX = (futureX + targetX) / 2;
  const crossY = trapY + 0.91;

  const cross = new M.VGroup(
    line(
      [crossX - 0.16, crossY - 0.16, 0],
      [crossX + 0.16, crossY + 0.16, 0],
      C.amber,
      5
    ),
    line(
      [crossX - 0.16, crossY + 0.16, 0],
      [crossX + 0.16, crossY - 0.16, 0],
      C.amber,
      5
    )
  );

  await until(S(39));
  await play(
    new M.FadeIn(warning),
    new M.FadeIn(cross),
    ...say('NEVER LET THE RULE SEE THE FUTURE', C.amber)
  );

  // ------------------------------------------------------------
  // 40: Recap — preserve time order, roll the origin,
  // forecast, reveal, measure, repeat.
  // ------------------------------------------------------------

  const recapY = P ? -5.1 : -3.3;

  const recapScore = pill(
    'MAE = 8 ÷ 4 = 2 CASES',
    C.green,
    P ? 21 : 20
  );

  recapScore.moveTo([0, recapY, 0]);

  const recapHeading = txt(
    'ROLLING-ORIGIN VALIDATION',
    P ? 23 : 22,
    C.green,
    [0, P ? 2.57 : 1.36, 0],
    true
  );

  // Restore the chronological replay after removing the trap.
  const finalParts = replayParts.slice(1);

  await until(S(40));
  await play(
    ...fadeOut([
      ...trapCards,
      trapTitle,
      leakArrow,
      leakLabel,
      warning,
      cross
    ]),
    new M.FadeIn(recapHeading),
    ...fadeIn(finalParts),
    ...fadeIn(replayRows),
    ...fadeIn(replayLegend),
    new M.FadeIn(recapScore),
    ...say('FORECAST → REVEAL → SCORE → ROLL', C.green)
  );

  // Emphasize each successive origin during the recap.
  await play(
    new M.LaggedStart(
      replayCutoffs.map(c =>
        new M.Indicate(c, { color: C.green })
      ),
      {
        lagRatio: 0.35,
        runTime: Math.min(
          2.6,
          Math.max(1.2, E(40) - S(40) - 1.8)
        )
      }
    )
  );
}
